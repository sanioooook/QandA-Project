using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using QandA.Api.Common;
using QandA.Api.Data;
using QandA.Api.Domain;

namespace QandA.Api.Auth;

public record CredentialsRequest(string? Login, string? Password);

public record UserDto(int Id, string Login);

public partial class AuthService(AppDbContext db, IPasswordHasher<User> hasher, TimeProvider clock)
{
    // Hash of a random password, verified against when the login does not exist so that
    // "unknown login" and "wrong password" take the same time.
    private static readonly Lazy<string> DummyHash =
        new(() => new PasswordHasher<User>().HashPassword(null!, Guid.NewGuid().ToString()));

    [GeneratedRegex("^[A-Za-z0-9_.@-]+$")]
    private static partial Regex LoginPattern();

    public async Task<UserDto> RegisterAsync(CredentialsRequest request, CancellationToken ct)
    {
        var login = (request.Login ?? "").Trim();
        var password = request.Password ?? "";

        if (login.Length < Limits.LoginMin || login.Length > Limits.LoginMax)
            throw AppException.Validation("login_length", $"Login must be {Limits.LoginMin}-{Limits.LoginMax} characters.", "login");
        if (!LoginPattern().IsMatch(login))
            throw AppException.Validation("login_chars", "Login may contain only latin letters, digits and _ . @ -", "login");
        if (password.Length < Limits.PasswordMin || password.Length > Limits.PasswordMax)
            throw AppException.Validation("password_length", $"Password must be {Limits.PasswordMin}-{Limits.PasswordMax} characters.", "password");
        if (!password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            throw AppException.Validation("password_weak", "Password must contain at least one letter and one digit.", "password");
        if (string.Equals(password, login, StringComparison.OrdinalIgnoreCase))
            throw AppException.Validation("password_equals_login", "Password must differ from the login.", "password");

        var normalized = login.ToUpperInvariant();
        if (await db.Users.AnyAsync(u => u.NormalizedLogin == normalized, ct))
            throw LoginTaken();

        var user = new User { Login = login, NormalizedLogin = normalized, CreatedAt = clock.GetUtcNow() };
        user.PasswordHash = hasher.HashPassword(user, password);
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Two registrations with the same login raced past the check above.
            throw LoginTaken();
        }

        return new UserDto(user.Id, user.Login);
    }

    public async Task<UserDto> LoginAsync(CredentialsRequest request, CancellationToken ct)
    {
        var normalized = (request.Login ?? "").Trim().ToUpperInvariant();
        var password = request.Password ?? "";
        if (normalized.Length == 0 || password.Length == 0)
            throw AppException.Validation("credentials_required", "Login and password are required.");

        var user = await db.Users.SingleOrDefaultAsync(u => u.NormalizedLogin == normalized, ct);
        if (user is null)
        {
            hasher.VerifyHashedPassword(null!, DummyHash.Value, password);
            throw InvalidCredentials();
        }

        var result = hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed)
            throw InvalidCredentials();
        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = hasher.HashPassword(user, password);
            await db.SaveChangesAsync(ct);
        }

        return new UserDto(user.Id, user.Login);
    }

    public async Task<UserDto?> FindAsync(int id, CancellationToken ct) =>
        await db.Users.Where(u => u.Id == id).Select(u => new UserDto(u.Id, u.Login)).SingleOrDefaultAsync(ct);

    private static AppException LoginTaken() => AppException.Conflict("login_taken", "This login is already taken.", "login");

    private static AppException InvalidCredentials() =>
        AppException.Unauthorized("invalid_credentials", "Wrong login or password.");
}
