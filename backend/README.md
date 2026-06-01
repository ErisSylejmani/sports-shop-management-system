# Backend — API

Kjo është API-ja .NET e projektit tonë: inventar, shitje, furnitorë, klientë, kthime, oferta. Autentifikimi bëhet me JWT; autorizimi me rolet Admin, Manager dhe User (staf).

## Çfarë ju duhet në PC

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- **SQL Server** ose **LocalDB** (parazgjedhja në dev)


## Struktura

| Folder | Për çfarë është |
|--------|------------------|
| `Data/` | Entitetet, `AppDbContext`, `RoleSeeder` |
| `Migrations/` | Skema e databazës (EF) |
| `Endpoints/` | Rrugët Minimal API |
| `Services/` | Logjika (shitje, porosi, kthime, oferta…) |
| `Contracts/` | DTO / request / response |
| `Program.cs` | Auth, CORS, Swagger, DI |



# Pas ndryshimit të entiteteve në kod
dotnet ef migrations add EmriMigrimit --project backend

# Apliko në databazën që keni në connection string
dotnet ef database update --project backend
```

## Nisja

```bash
cd backend
dotnet run
```


| HTTP | http://localhost:5079 |
| HTTPS | https://localhost:7051 |
| Swagger | http://localhost:5079/swagger (vetëm Development) |

Nëse build dështon sepse `backend.exe` është i bllokuar — ndaloni instancën e vjetër të `dotnet run` dhe provoni përsëri.


### Si marrim Admin-in e parë

```sql
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id
FROM AspNetUsers u
CROSS JOIN AspNetRoles r
WHERE u.Email = 'emaili-juaj@example.com' AND r.Name = 'Admin';
```

## Rolet (si i kemi menduar)

| Rol | Kush është | Çfarë bën në praktikë |
|-----|------------|------------------------|
| **Admin** | Zotërues sistemi | Përdoruesit, rolet, gjithçka tjetër |
| **Manager** | Menaxher dyqani | CRUD katalog, furnitorë, shitje, klientë… |
| **User** | Staf (shitës) | Shitje të reja, kthime, lexon produkte/klientë|



## Modulet e API-s

| Modul | URL bazë |
|-------|----------|
| Auth | `/api/auth/*`, `/api/me` |
| Admin | `/api/admin/users`, `/api/admin/roles` |
| Kategori | `/api/kategorite` |
| Produkte | `/api/produkte` |
| Furnitorë | `/api/furnitore` |
| Porosi furnitori | `/api/porosi-furnitore` |
| Klientë | `/api/klientet` |
| Punëtorë | `/api/punetoret` |
| Shitje | `/api/shitjet` (+ `/detajet`) |
| Kthime | `/api/kthimet` |
| Oferta | `/api/ofertat` (+ produktet në ofertë) |


## Komanda që përdorim shpesh

```bash
dotnet build
dotnet run
dotnet ef database update --project backend
```
