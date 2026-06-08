using GreyPileApi.Data;

namespace GreyPileApi.Services;

public static class StageHelper
{
    public static readonly Stage[] Order =
        [Stage.Unbuilt, Stage.Built, Stage.Primed, Stage.Base, Stage.Painted];

    public static int Index(Stage s) => Array.IndexOf(Order, s);

    public static Stage Next(Stage s) => Order[Math.Min(Index(s) + 1, Order.Length - 1)];

    public static double CompletionPct(IList<Stage> stages)
    {
        if (stages.Count == 0) return 0;
        var sum = stages.Sum(s => (double)Index(s));
        return Math.Round(sum / (4.0 * stages.Count) * 100, 1);
    }
}
