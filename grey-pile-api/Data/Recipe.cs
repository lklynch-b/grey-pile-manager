using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("recipes")]
public class Recipe
{
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; } = 1;

    [Column("name"), MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("note")]
    public string? Note { get; set; }

    // Optional faction association — lets users tag a recipe as "for Verdant Host" etc.
    // Null means it's a general recipe not tied to any specific army.
    [Column("faction_id")]
    public long? FactionId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public List<RecipePart> Parts   { get; set; } = [];
    public Faction?         Faction { get; set; }
}
