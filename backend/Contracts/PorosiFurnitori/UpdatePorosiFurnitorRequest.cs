namespace backend.Contracts.PorosiFurnitori;

public sealed record UpdatePorosiFurnitorRequest(
    Guid FurnitorId,
    DateTime DataPorosise,
    DateTime? DataPritshme,
    string Statusi,
    IReadOnlyList<PorosiFurnitorDetajLineRequest> Detajet);
