using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("paints")]
public class Paint
{
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; } = 1;

    [Column("name"), MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("hex"), MaxLength(7)]
    public string Hex { get; set; } = string.Empty;

    [Column("type"), MaxLength(20)]
    public PaintType Type { get; set; }

    [Column("is_favourite")]
    public bool IsFavourite { get; set; } = false;

    [Column("partner_id")]
    public long? PartnerId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public Paint? Partner { get; set; }
}
