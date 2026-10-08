using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using Npgsql;
using QandA.Api.Data;

namespace QandA.Api.Tests.Infrastructure;

/// <summary>
/// Runs the real API against a throw-away PostgreSQL database (one per test class).
/// The server is taken from TEST_DB_CONNECTION, which docker compose sets for the test container.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // Starts at the real "now": the cookie handler also uses this clock for the cookie expiry,
    // and the HttpClient cookie container drops cookies that look expired in real time.
    public static readonly DateTimeOffset Start = DateTimeOffset.UtcNow;

    private readonly string _connectionString;

    public ApiFactory()
    {
        var server = Environment.GetEnvironmentVariable("TEST_DB_CONNECTION")
            ?? "Host=localhost;Port=5432;Username=qanda;Password=qanda";
        _connectionString = new NpgsqlConnectionStringBuilder(server) { Database = $"qanda_test_{Guid.NewGuid():N}" }.ConnectionString;
    }

    public FakeTimeProvider Clock { get; } = new(Start);

    protected virtual int AuthPermitLimit => 10_000;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureLogging(logging => logging.ClearProviders());
        builder.UseSetting("ConnectionStrings:Default", _connectionString);
        builder.UseSetting("RateLimiting:AuthPermitLimit", AuthPermitLimit.ToString());
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(Clock);
        });
    }

    public ValueTask InitializeAsync()
    {
        // Touching Services starts the host, which applies the migrations.
        _ = Services;
        return ValueTask.CompletedTask;
    }

    public async Task<T> WithDbAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public override async ValueTask DisposeAsync()
    {
        await WithDbAsync(db => db.Database.EnsureDeletedAsync());
        await base.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}

/// <summary>Same API with a tiny login rate limit, for the throttling test.</summary>
public class ThrottledApiFactory : ApiFactory
{
    public const int Limit = 3;
    protected override int AuthPermitLimit => Limit;
}
