using System.Net;
using Microsoft.EntityFrameworkCore;
using QandA.Api.Auth;
using QandA.Api.Tests.Infrastructure;

namespace QandA.Api.Tests;

public class AuthTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private ApiClient Anonymous() => new(factory.CreateClient());

    [Fact]
    public async Task Register_signs_the_user_in()
    {
        var login = ApiClient.UniqueLogin("alice");
        var client = Anonymous();

        var created = await (await client.PostAsync("/api/auth/register", new { login, password = ApiClient.Password }))
            .ReadAs<UserDto>(HttpStatusCode.Created);

        Assert.Equal(login, created.Login);
        Assert.Equal(created, await client.MeAsync());
    }

    [Fact]
    public async Task Password_is_stored_as_a_hash_not_as_plain_text()
    {
        var login = ApiClient.UniqueLogin();
        await ApiClient.SignedUpAsync(factory, login);

        var hash = await factory.WithDbAsync(db => db.Users.Where(u => u.Login == login).Select(u => u.PasswordHash).SingleAsync());

        Assert.DoesNotContain(ApiClient.Password, hash);
        Assert.True(hash.Length > 40);
    }

    [Fact]
    public async Task Auth_cookie_is_http_only_and_same_site()
    {
        var response = await Anonymous().PostAsync("/api/auth/register", new { login = ApiClient.UniqueLogin(), password = ApiClient.Password });

        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith("qanda.auth="));
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Register_rejects_taken_login_ignoring_case()
    {
        var login = ApiClient.UniqueLogin("bob");
        await ApiClient.SignedUpAsync(factory, login);

        var response = await Anonymous().PostAsync("/api/auth/register", new { login = login.ToUpperInvariant(), password = ApiClient.Password });

        await response.ShouldFailWith(HttpStatusCode.Conflict, "login_taken");
    }

    [Theory]
    [InlineData("ab", "Secret123", "login_length")]
    [InlineData("this_login_is_way_too_long_for_us", "Secret123", "login_length")]
    [InlineData("bad login!", "Secret123", "login_chars")]
    [InlineData("валідний", "Secret123", "login_chars")]
    [InlineData("validlogin", "Short1", "password_length")]
    [InlineData("validlogin", "onlyletters", "password_weak")]
    [InlineData("validlogin", "1234567890", "password_weak")]
    [InlineData("Login12345", "login12345", "password_equals_login")]
    [InlineData(null, "Secret123", "login_length")]
    [InlineData("validlogin", null, "password_length")]
    public async Task Register_rejects_invalid_credentials(string? login, string? password, string code)
    {
        var response = await Anonymous().PostAsync("/api/auth/register", new { login, password });

        await response.ShouldFailWith(HttpStatusCode.BadRequest, code);
    }

    [Fact]
    public async Task Login_ignores_case_and_surrounding_spaces_of_the_login()
    {
        var login = ApiClient.UniqueLogin("carol");
        await ApiClient.SignedUpAsync(factory, login);
        var client = Anonymous();

        var user = await (await client.PostAsync("/api/auth/login", new { login = $"  {login.ToUpperInvariant()} ", password = ApiClient.Password }))
            .ReadAs<UserDto>();

        Assert.Equal(login, user.Login);
        Assert.Equal(login, (await client.MeAsync()).Login);
    }

    [Fact]
    public async Task Login_with_wrong_password_and_unknown_login_fail_the_same_way()
    {
        var login = ApiClient.UniqueLogin();
        await ApiClient.SignedUpAsync(factory, login);

        var wrongPassword = await Anonymous().PostAsync("/api/auth/login", new { login, password = "Wrong12345" });
        var unknownLogin = await Anonymous().PostAsync("/api/auth/login", new { login = "nobody_here", password = ApiClient.Password });

        await wrongPassword.ShouldFailWith(HttpStatusCode.Unauthorized, "invalid_credentials");
        await unknownLogin.ShouldFailWith(HttpStatusCode.Unauthorized, "invalid_credentials");
    }

    [Fact]
    public async Task Login_without_credentials_is_a_validation_error()
    {
        var response = await Anonymous().PostAsync("/api/auth/login", new { login = "", password = "" });

        await response.ShouldFailWith(HttpStatusCode.BadRequest, "credentials_required");
    }

    [Fact]
    public async Task Logout_ends_the_session()
    {
        var client = await ApiClient.SignedUpAsync(factory);

        await (await client.PostAsync("/api/auth/logout")).ShouldBe(HttpStatusCode.NoContent);

        await (await client.GetAsync("/api/auth/me")).ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("/api/auth/me")]
    [InlineData("/api/surveys")]
    [InlineData("/api/surveys/00000000-0000-0000-0000-000000000001")]
    public async Task Protected_endpoints_return_401_without_redirecting(string url)
    {
        var response = await Anonymous().GetAsync(url);

        await response.ShouldBe(HttpStatusCode.Unauthorized);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task Forged_cookie_is_rejected()
    {
        var client = Anonymous();
        client.Http.DefaultRequestHeaders.Add("Cookie", "qanda.auth=forged-value");

        await (await client.GetAsync("/api/auth/me")).ShouldBe(HttpStatusCode.Unauthorized);
    }
}

public class AuthRateLimitTests(ThrottledApiFactory factory) : IClassFixture<ThrottledApiFactory>
{
    [Fact]
    public async Task Too_many_login_attempts_are_throttled()
    {
        var client = new ApiClient(factory.CreateClient());
        for (var i = 0; i < ThrottledApiFactory.Limit; i++)
            await (await client.PostAsync("/api/auth/login", new { login = "someone", password = "Guess1234" })).ShouldBe(HttpStatusCode.Unauthorized);

        var throttled = await client.PostAsync("/api/auth/login", new { login = "someone", password = "Guess1234" });

        await throttled.ShouldBe(HttpStatusCode.TooManyRequests);
    }
}
