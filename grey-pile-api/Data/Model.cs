using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("models")]
public class Model
{
    [Column("id")]
    public long Id { get; set; }

    [Column("unit_id")]
    public long UnitId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; } = 1;

    [Column("stage"), MaxLength(20)]
    public Stage Stage { get; set; } = Stage.Unbuilt;

    [Column("photo_url"), MaxLength(500)]
    public string? PhotoUrl { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("recipe_id")]
    public long? RecipeId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public Unit Unit { get; set; } = null!;
    public Recipe? Recipe { get; set; }
}
