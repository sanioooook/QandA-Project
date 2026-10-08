namespace QandA.Api.Domain;

public class User
{
    public int Id { get; set; }
    public required string Login { get; set; }
    /// <summary>Upper-cased login, used for case-insensitive uniqueness.</summary>
    public required string NormalizedLogin { get; set; }
    public string PasswordHash { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
}

public class Survey
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    /// <summary>Null while the survey is a private draft.</summary>
    public DateTimeOffset? PublishedAt { get; set; }
    /// <summary>After this moment no votes or new options are accepted.</summary>
    public DateTimeOffset? Deadline { get; set; }
    /// <summary>How many options a single participant may vote for at once.</summary>
    public int MaxVotesPerUser { get; set; } = 1;
    public bool AllowParticipantOptions { get; set; }
    /// <summary>How many options a single participant may add (when allowed).</summary>
    public int MaxOptionsPerParticipant { get; set; } = 1;

    public List<SurveyOption> Options { get; set; } = [];
    public List<Vote> Votes { get; set; } = [];
}

public class SurveyOption
{
    public int Id { get; set; }
    public Guid SurveyId { get; set; }
    public Survey Survey { get; set; } = null!;
    public required string Text { get; set; }
    public int Position { get; set; }
    /// <summary>Participant who added the option; null for options created by the author.</summary>
    public int? AddedById { get; set; }
    public User? AddedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public List<Vote> Votes { get; set; } = [];
}

public class Vote
{
    public int OptionId { get; set; }
    public SurveyOption Option { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    /// <summary>Denormalized from the option so per-survey queries need no join.</summary>
    public Guid SurveyId { get; set; }
    public Survey Survey { get; set; } = null!;
    public DateTimeOffset VotedAt { get; set; }
}
