using GreyPileApi.Data;
using GreyPileApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GreyPileApi.Controllers;

[ApiController]
[Route("api/units")]
public class UnitsController(GreyPileDbContext db) : ControllerBase
{
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var unit = await db.Units
            .Include(u => u.Faction)
            .Include(u => u.Models)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (unit is null) return NotFound();

        var stages = unit.Models.Select(m => m.Stage).ToList();

        return Ok(new
        {
            unit.Id,
            unit.Name,
            unit.PhotoUrl,
            unit.FactionId,
            FactionName = unit.Faction.Name,
            ModelCount = unit.Models.Count,
            Models = unit.Models.Select(m => new
            {
                m.Id,
                m.Stage,
                m.PhotoUrl,
                m.Notes,
                m.RecipeId
            }),
            Progress = stages,
            CompletionPct = StageHelper.CompletionPct(stages)
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUnitRequest body)
    {
        var now = DateTime.UtcNow;
        var unit = new Unit
        {
            FactionId = body.FactionId,
            Name = body.Name,
            PhotoUrl = body.PhotoUrl,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Units.Add(unit);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = unit.Id }, new { unit.Id, unit.FactionId, unit.Name, unit.PhotoUrl });
    }

    [HttpPost("with-models")]
    public async Task<IActionResult> CreateWithModels([FromBody] CreateUnitWithModelsRequest body)
    {
        var now = DateTime.UtcNow;

        var faction = await db.Factions.FirstOrDefaultAsync(f =>
            f.UserId == 1 && f.Name.ToLower() == body.FactionName.ToLower());

        if (faction is null)
        {
            faction = new Faction { Name = body.FactionName, CreatedAt = now, UpdatedAt = now };
            db.Factions.Add(faction);
            await db.SaveChangesAsync();
        }

        var unit = new Unit
        {
            FactionId = faction.Id,
            Name = body.UnitName,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Units.Add(unit);
        await db.SaveChangesAsync();

        var models = Enumerable.Range(0, body.Count)
            .Select(_ => new Model { UnitId = unit.Id, Stage = body.Stage, CreatedAt = now, UpdatedAt = now })
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
        return Ok(new { unit.Id, unit.FactionId, unit.Name, unit.PhotoUrl });
    }

    [HttpPatch("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateUnitRequest body)
    {
        var unit = await db.Units.FindAsync(id);
        if (unit is null) return NotFound();

        if (body.Name is not null) unit.Name = body.Name;
        if (body.PhotoUrl is not null) unit.PhotoUrl = body.PhotoUrl;
        unit.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(new { unit.Id, unit.FactionId, unit.Name, unit.PhotoUrl });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var unit = await db.Units.FindAsync(id);
        if (unit is null) return NotFound();

        db.Units.Remove(unit);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateUnitRequest(long FactionId, string Name, string? PhotoUrl);
public record CreateUnitWithModelsRequest(string FactionName, string UnitName, int Count, Stage Stage);
public record UpdateUnitRequest(string? Name, string? PhotoUrl);
