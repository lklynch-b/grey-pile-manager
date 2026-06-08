using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("recipe_parts")]
public class RecipePart
{
    [Column("id")]
    public long Id { get; set; }

    [Column("recipe_id")]
    public long RecipeId { get; set; }

    [Column("paint_id")]
    public long PaintId { get; set; }

    [Column("sort_order")]
    public int SortOrder { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public Recipe Recipe { get; set; } = null!;
    public Paint Paint { get; set; } = null!;
}
