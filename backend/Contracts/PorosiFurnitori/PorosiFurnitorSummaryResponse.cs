namespace backend.Contracts.PorosiFurnitori;

public sealed record PorosiFurnitorSummaryResponse(
    Guid PorosiId,
    Guid FurnitorId,
    string FurnitorEmri,
    DateTime DataPorosise,
    DateTime? DataPritshme,
    decimal ShumaTotale,
    string Statusi);
