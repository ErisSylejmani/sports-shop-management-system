namespace backend.Contracts.Admin;

public sealed record AdminUsersListResponse(
    IReadOnlyList<AdminUserListItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize);
