using GreyPileApi.Data;
using GreyPileApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace GreyPileApi.Controllers;

[ApiController]
[Route("api/models")]
public class ModelsController(GreyPileDbContext db) : ControllerBase
{
    [HttpPost("bulk")]
    public async Task<IActionResult> AddModels([FromBody] AddModelsRequest body)
    {
        var unit = await db.Units.FindAsync(body.UnitId);
        if (unit is null) return NotFound($"Unit {body.UnitId} not found.");

        var now = DateTime.UtcNow;

        var models = Enumerable.Range(0, body.Count)
            .Select(_ => new Model { UnitId = body.UnitId, Stage = body.Stage, CreatedAt = now, UpdatedAt = now })
            .ToList();

        db.Models.AddRange(models);
        await db.SaveChangesAsync();

        db.JournalEntries.AddRange(models.Select(m => new JournalEntry
        {
            ModelId = m.Id,
            FromStage = null,
            ToStage = body.Stage,
            AdvancedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        }));

        await db.SaveChangesAsync();
        return Ok(new { unit.Id, unit.Name, ModelsCreated = body.Count });
    }

    [HttpPost("{id:long}/advance")]
    public async Task<IActionResult> AdvanceStage(long id)
    {
        var model = await db.Models.FindAsync(id);
        if (model is null) return NotFound();

        var from = model.Stage;
        var to = StageHelper.Next(from);

        if (from != to)
        {
            var now = DateTime.UtcNow;
            model.Stage = to;
            model.UpdatedAt = now;

            db.JournalEntries.Add(new JournalEntry
            {
                ModelId = model.Id,
                FromStage = from,
                ToStage = to,
                AdvancedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            });

            await db.SaveChangesAsync();
        }

        return Ok(ModelSummary(model));
    }

    [HttpPatch("{id:long}/stage")]
    public async Task<IActionResult> SetStage(long id, [FromBody] SetStageRequest body)
    {
        var model = await db.Models.FindAsync(id);
        if (model is null) return NotFound();

        var now = DateTime.UtcNow;
        var from = model.Stage;
        model.Stage = body.Stage;
        model.UpdatedAt = now;

        db.JournalEntries.Add(new JournalEntry
        {
            ModelId = model.Id,
            FromStage = from,
            ToStage = body.Stage,
            AdvancedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        });

        await db.SaveChangesAsync();
        return Ok(ModelSummary(model));
    }

    [HttpPatch("{id:long}/notes")]
    public async Task<IActionResult> UpdateNotes(long id, [FromBody] UpdateNotesRequest body)
    {
        var model = await db.Models.FindAsync(id);
        if (model is null) return NotFound();

        model.Notes = body.Notes;
        model.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ModelSummary(model));
    }

    [HttpPatch("{id:long}/recipe")]
    public async Task<IActionResult> AssignRecipe(long id, [FromBody] AssignRecipeRequest body)
    {
        var model = await db.Models.FindAsync(id);
        if (model is null) return NotFound();

        model.RecipeId = body.RecipeId;
        model.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ModelSummary(model));
    }

    private static object ModelSummary(Model m) =>
        new { m.Id, m.UnitId, m.Stage, m.Notes, m.RecipeId };
}

public record AddModelsRequest(long UnitId, int Count, Stage Stage);
public record SetStageRequest(Stage Stage);
public record UpdateNotesRequest(string? Notes);
public record AssignRecipeRequest(long RecipeId);
