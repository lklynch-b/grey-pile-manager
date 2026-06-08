using GreyPileApi.Data;
using GreyPileApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GreyPileApi.Controllers;

[ApiController]
[Route("api/roster")]
public class RosterController(GreyPileDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetRoster()
    {
        var factions = await db.Factions
            .Include(f => f.Units)
                .ThenInclude(u => u.Models)
            .Where(f => f.UserId == 1)
            .OrderBy(f => f.Name)
            .ToListAsync();

        var result = factions.Select(f => new
        {
            f.Id,
            f.Name,
            f.Blurb,
            f.Accent,
            f.Tint,
            Units = f.Units.Select(u =>
            {
                var stages = u.Models.Select(m => m.Stage).ToList();
                return new
                {
                    u.Id,
                    u.Name,
                    u.PhotoUrl,
                    ModelCount = u.Models.Count,
                    StageCounts = new
                    {
                        Unbuilt = stages.Count(s => s == Stage.Unbuilt),
                        Built   = stages.Count(s => s == Stage.Built),
                        Primed  = stages.Count(s => s == Stage.Primed),
                        Base    = stages.Count(s => s == Stage.Base),
                        Painted = stages.Count(s => s == Stage.Painted)
                    },
                    CompletionPct = StageHelper.CompletionPct(stages)
                };
            })
        });

        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stages = await db.Models
            .Where(m => m.UserId == 1)
            .Select(m => m.Stage)
            .ToListAsync();

        var perStage = Enum.GetValues<Stage>()
            .Select(s => new { Stage = s, Count = stages.Count(m => m == s) })
            .ToList();

        return Ok(new
        {
            Total   = stages.Count,
            PerStage = perStage,
            Painted = stages.Count(s => s == Stage.Painted),
            Wip     = stages.Count(s => s is Stage.Built or Stage.Primed or Stage.Base),
            Pile    = stages.Count(s => s == Stage.Unbuilt)
        });
    }
}
