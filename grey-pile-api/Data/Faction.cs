using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("factions")]
public class Faction
{
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; } = 1;

    [Column("name"), MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("blurb"), MaxLength(255)]
    public string? Blurb { get; set; }

    [Column("accent"), MaxLength(7)]
    public string? Accent { get; set; }

    [Column("tint"), MaxLength(7)]
    public string? Tint { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public List<Unit> Units { get; set; } = [];
}
