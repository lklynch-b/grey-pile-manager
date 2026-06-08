using GreyPileApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GreyPileApi.Controllers;

[ApiController]
[Route("api/factions")]
public class FactionsController(GreyPileDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var factions = await db.Factions
            .Where(f => f.UserId == 1)
            .OrderBy(f => f.Name)
            .Select(f => new { f.Id, f.Name, f.Blurb, f.Accent, f.Tint })
            .ToListAsync();

        return Ok(factions);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var faction = await db.Factions.FindAsync(id);
        return faction is null ? NotFound() : Ok(faction);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFactionRequest body)
    {
        var now = DateTime.UtcNow;
        var faction = new Faction
        {
            Name = body.Name,
            Blurb = body.Blurb,
            Accent = body.Accent,
            Tint = body.Tint,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Factions.Add(faction);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = faction.Id }, faction);
    }

    [HttpPatch("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateFactionRequest body)
    {
        var faction = await db.Factions.FindAsync(id);
        if (faction is null) return NotFound();

        if (body.Name is not null) faction.Name = body.Name;
        if (body.Blurb is not null) faction.Blurb = body.Blurb;
        if (body.Accent is not null) faction.Accent = body.Accent;
        if (body.Tint is not null) faction.Tint = body.Tint;
        faction.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(faction);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var faction = await db.Factions.FindAsync(id);
        if (faction is null) return NotFound();

        db.Factions.Remove(faction);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateFactionRequest(string Name, string? Blurb, string? Accent, string? Tint);
public record UpdateFactionRequest(string? Name, string? Blurb, string? Accent, string? Tint);
