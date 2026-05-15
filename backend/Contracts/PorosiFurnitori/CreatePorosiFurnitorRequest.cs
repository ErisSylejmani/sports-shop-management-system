namespace backend.Contracts.PorosiFurnitori;

public sealed record CreatePorosiFurnitorRequest(
    Guid FurnitorId,
    DateTime? DataPorosise,
    DateTime? DataPritshme,
    string Statusi,
    IReadOnlyList<PorosiFurnitorDetajLineRequest> Detajet);
