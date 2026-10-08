using Microsoft.EntityFrameworkCore;
using QandA.Api.Domain;

namespace QandA.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyOption> Options => Set<SurveyOption>();
    public DbSet<Vote> Votes => Set<Vote>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.Property(u => u.Login).HasMaxLength(Limits.LoginMax);
            e.Property(u => u.NormalizedLogin).HasMaxLength(Limits.LoginMax);
            e.HasIndex(u => u.NormalizedLogin).IsUnique();
        });

        b.Entity<Survey>(e =>
        {
            e.Property(s => s.Title).HasMaxLength(Limits.TitleMax);
            e.Property(s => s.Description).HasMaxLength(Limits.DescriptionMax);
            e.HasOne(s => s.Author).WithMany().HasForeignKey(s => s.AuthorId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(s => s.AuthorId);
            e.HasIndex(s => s.PublishedAt);
        });

        b.Entity<SurveyOption>(e =>
        {
            e.Property(o => o.Text).HasMaxLength(Limits.OptionTextMax);
            e.HasOne(o => o.Survey).WithMany(s => s.Options).HasForeignKey(o => o.SurveyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(o => o.AddedBy).WithMany().HasForeignKey(o => o.AddedById).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(o => new { o.SurveyId, o.Position });
        });

        b.Entity<Vote>(e =>
        {
            e.HasKey(v => new { v.OptionId, v.UserId });
            e.HasOne(v => v.Option).WithMany(o => o.Votes).HasForeignKey(v => v.OptionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(v => v.User).WithMany().HasForeignKey(v => v.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(v => v.Survey).WithMany(s => s.Votes).HasForeignKey(v => v.SurveyId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(v => new { v.SurveyId, v.UserId });
        });
    }
}
