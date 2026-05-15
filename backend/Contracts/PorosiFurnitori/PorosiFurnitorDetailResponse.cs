namespace backend.Contracts.PorosiFurnitori;

public sealed record PorosiFurnitorDetailResponse(
    Guid PorosiId,
    Guid FurnitorId,
    string FurnitorEmri,
    DateTime DataPorosise,
    DateTime? DataPritshme,
    decimal ShumaTotale,
    string Statusi,
    IReadOnlyList<PorosiFurnitorDetajResponse> Detajet);
