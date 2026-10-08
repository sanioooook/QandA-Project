using Microsoft.AspNetCore.Mvc;
using QandA.Api.Common;
using QandA.Api.Domain;

namespace QandA.Api.Surveys;

[ApiController]
[Route("api/surveys")]
public class SurveysController(SurveyService surveys) : ControllerBase
{
    [HttpGet]
    public Task<Paged<SurveySummary>> List(
        SurveyScope scope = SurveyScope.Active,
        SurveyStatus? status = null,
        int page = 1,
        int pageSize = Limits.PageSizeDefault,
        CancellationToken ct = default) =>
        surveys.ListAsync(User.GetUserId(), scope, status, page, pageSize, ct);

    [HttpGet("{id:guid}")]
    public Task<SurveyDetails> Get(Guid id, CancellationToken ct) => surveys.GetAsync(id, User.GetUserId(), ct);

    [HttpPost]
    public async Task<ActionResult<SurveyDetails>> Create(SurveyInput input, CancellationToken ct)
    {
        var survey = await surveys.CreateAsync(input, User.GetUserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = survey.Id }, survey);
    }

    [HttpPut("{id:guid}")]
    public Task<SurveyDetails> Update(Guid id, SurveyInput input, CancellationToken ct) =>
        surveys.UpdateAsync(id, input, User.GetUserId(), ct);

    [HttpPost("{id:guid}/publish")]
    public Task<SurveyDetails> Publish(Guid id, CancellationToken ct) => surveys.PublishAsync(id, User.GetUserId(), ct);

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await surveys.DeleteAsync(id, User.GetUserId(), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/votes")]
    public Task<SurveyDetails> Vote(Guid id, VoteInput input, CancellationToken ct) =>
        surveys.VoteAsync(id, input, User.GetUserId(), ct);

    [HttpPost("{id:guid}/options")]
    public Task<SurveyDetails> AddOption(Guid id, AddOptionInput input, CancellationToken ct) =>
        surveys.AddOptionAsync(id, input, User.GetUserId(), ct);
}
