using HotChocolate;

namespace GreyPileApi.Data;

public enum PaintType
{
    [GraphQLName("base")]     Base,
    [GraphQLName("layer")]    Layer,
    [GraphQLName("wash")]     Wash,
    [GraphQLName("metallic")] Metallic,
    [GraphQLName("texture")]  Texture
}
