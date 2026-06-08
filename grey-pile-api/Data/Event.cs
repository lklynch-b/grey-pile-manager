using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("events")]
public class Event
{
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; } = 1;

    [Column("name"), MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("short_name"), MaxLength(20)]
    public string ShortName { get; set; } = string.Empty;

    [Column("venue"), MaxLength(255)]
    public string? Venue { get; set; }

    [Column("event_date")]
    public DateOnly EventDate { get; set; }

    [Column("scope"), MaxLength(255)]
    public string Scope { get; set; } = string.Empty;

    [Column("models_needed")]
    public int ModelsNeeded { get; set; }

    [Column("color"), MaxLength(7)]
    public string Color { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public List<EventUnit> EventUnits { get; set; } = [];
}
