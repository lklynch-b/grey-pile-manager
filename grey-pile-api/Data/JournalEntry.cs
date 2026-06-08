using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyPileApi.Data;

[Table("journal_entries")]
public class JournalEntry
{
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; } = 1;

    [Column("model_id")]
    public long ModelId { get; set; }

    [Column("from_stage"), MaxLength(20)]
    public Stage? FromStage { get; set; }

    [Column("to_stage"), MaxLength(20)]
    public Stage ToStage { get; set; }

    [Column("advanced_at")]
    public DateTime AdvancedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public Model Model { get; set; } = null!;
}
