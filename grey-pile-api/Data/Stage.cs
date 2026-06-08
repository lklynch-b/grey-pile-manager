using HotChocolate;

namespace GreyPileApi.Data;

// GraphQLName makes HotChocolate use lowercase for both serialisation (queries)
// and deserialisation (mutation inputs), keeping the TypeScript types in sync.
public enum Stage
{
    [GraphQLName("unbuilt")] Unbuilt,
    [GraphQLName("built")]   Built,
    [GraphQLName("primed")]  Primed,
    [GraphQLName("base")]    Base,
    [GraphQLName("painted")] Painted
}
