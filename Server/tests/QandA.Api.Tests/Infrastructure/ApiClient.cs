using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using QandA.Api.Auth;
using QandA.Api.Surveys;

namespace QandA.Api.Tests.Infrastructure;

/// <summary>Thin typed wrapper over an <see cref="HttpClient"/> that keeps the auth cookie of one user.</summary>
public class ApiClient(HttpClient http)
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    public HttpClient Http { get; } = http;

    public static string UniqueLogin(string prefix = "user") => $"{prefix}_{Guid.NewGuid():N}"[..20];

    public const string Password = "Secret123";

    public static async Task<ApiClient> SignedUpAsync(ApiFactory factory, string? login = null)
    {
        var client = new ApiClient(factory.CreateClient());
        var response = await client.PostAsync("/api/auth/register", new { login = login ?? UniqueLogin(), password = Password });
        await response.ShouldBe(HttpStatusCode.Created);
        return client;
    }

    public Task<HttpResponseMessage> GetAsync(string url) => Http.GetAsync(url, Ct);

    public Task<HttpResponseMessage> PostAsync(string url, object? body = null) =>
        Http.PostAsJsonAsync(url, body ?? new { }, Json, Ct);

    public Task<HttpResponseMessage> PutAsync(string url, object body) => Http.PutAsJsonAsync(url, body, Json, Ct);

    public Task<HttpResponseMessage> DeleteAsync(string url) => Http.DeleteAsync(url, Ct);

    public async Task<SurveyDetails> CreateSurveyAsync(object input)
    {
        var response = await PostAsync("/api/surveys", input);
        await response.ShouldBe(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<SurveyDetails>(Json, Ct))!;
    }

    public Task<SurveyDetails> CreatePublishedAsync(
        int maxVotes = 1, bool allowOptions = false, int maxOptions = 1, DateTimeOffset? deadline = null, params string[] options) =>
        CreateSurveyAsync(new
        {
            title = "Where do we go on the weekend?",
            options = options.Length > 0 ? options : new[] { "Cinema", "Park", "Museum" },
            maxVotesPerUser = maxVotes,
            allowParticipantOptions = allowOptions,
            maxOptionsPerParticipant = maxOptions,
            deadline,
            publish = true,
        });

    public async Task<T> GetJsonAsync<T>(string url)
    {
        var response = await GetAsync(url);
        await response.ShouldBe(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<T>(Json, Ct))!;
    }

    public Task<SurveyDetails> GetSurveyAsync(Guid id) => GetJsonAsync<SurveyDetails>($"/api/surveys/{id}");

    public Task<UserDto> MeAsync() => GetJsonAsync<UserDto>("/api/auth/me");

    private static CancellationToken Ct => TestContext.Current.CancellationToken;
}

public static class ResponseAssertions
{
    public static async Task ShouldBe(this HttpResponseMessage response, HttpStatusCode expected)
    {
        if (response.StatusCode != expected)
        {
            var body = await response.Content.ReadAsStringAsync();
            Assert.Fail($"Expected {(int)expected} {expected}, got {(int)response.StatusCode} {response.StatusCode}: {body}");
        }
    }

    /// <summary>Asserts the status and the problem-details <c>code</c> of an error response.</summary>
    public static async Task ShouldFailWith(this HttpResponseMessage response, HttpStatusCode expected, string code)
    {
        await response.ShouldBe(expected);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(code, doc.RootElement.GetProperty("code").GetString());
    }

    public static async Task<T> ReadAs<T>(this HttpResponseMessage response, HttpStatusCode expected = HttpStatusCode.OK)
    {
        await response.ShouldBe(expected);
        return (await response.Content.ReadFromJsonAsync<T>(ApiClient.Json))!;
    }
}
