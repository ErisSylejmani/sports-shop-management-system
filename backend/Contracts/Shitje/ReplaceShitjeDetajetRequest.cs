namespace backend.Contracts.Shitje;

/// <summary>Zëvendëson të gjithë rreshtat e një shitjeje (update lines).</summary>
public sealed record ReplaceShitjeDetajetRequest(IReadOnlyList<KonfirmoShitjeLineRequest> Detajet);
