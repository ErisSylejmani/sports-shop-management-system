namespace backend.Contracts.Auth;

public sealed record RegisterRequest(
    string Emri,
    string Mbiemri,
    string Email,
    string Password,
    string? PhoneNumber,
    bool AssignUserRole = true);
