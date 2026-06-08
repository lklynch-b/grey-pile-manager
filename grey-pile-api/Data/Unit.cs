using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("units")]
public class Unit
{
    [Column("id")]
    public long Id { get; set; }

    [Column("faction_id")]
    public long FactionId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; } = 1;

    [Column("name"), MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("photo_url"), MaxLength(500)]
    public string? PhotoUrl { get; set; }

    [Column("import_id"), MaxLength(50)]
    public string? ImportId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public Faction Faction { get; set; } = null!;
    public List<Model> Models { get; set; } = [];
}
