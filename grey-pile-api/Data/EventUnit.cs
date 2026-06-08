using System.ComponentModel.DataAnnotations.Schema;
using HotChocolate;

namespace GreyPileApi.Data;

[Table("event_units")]
public class EventUnit
{
    [Column("id")]
    public long Id { get; set; }

    [Column("event_id")]
    public long EventId { get; set; }

    [Column("unit_id")]
    public long UnitId { get; set; }

    // Navigation properties are EF-only — excluded from the GraphQL schema to
    // avoid circular type chains (Event → EventUnit → Unit → Faction → Units → …)
    [GraphQLIgnore] public Event Event { get; set; } = null!;
    [GraphQLIgnore] public Unit  Unit  { get; set; } = null!;
}
