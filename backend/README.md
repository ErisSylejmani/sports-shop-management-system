# Sports Shop — Backend API

API .NET për menaxhimin e dyqanit sportiv (inventar, shitje, furnitorë, klientë, kthime, oferta). Autentifikim me **JWT** dhe autorizim sipas roleve **Admin**, **Manager**, **User**.

## Kërkesat

- [.NET SDK 10](https://dotnet.microsoft.com/download) (projekti targeton `net10.0`)
- **SQL Server** ose **LocalDB** (parazgjedhje në development)
- Opsionale: [EF Core CLI](https://learn.microsoft.com/ef/core/cli/dotnet) — `dotnet tool install --global dotnet-ef`

## Struktura e projektit

| Folder / skedar | Përmbajtja |
|-----------------|------------|
| `Data/` | Entitetet EF, `AppDbContext`, `RoleSeeder` |
| `Migrations/` | Migrimet e databazës |
| `Endpoints/` | Minimal API routes |
| `Services/` | Logjikë biznesi (shitje, porosi, kthim, oferta) |
| `Contracts/` | DTO / request / response |
| `Program.cs` | Konfigurim, auth, CORS, Swagger |

## Konfigurimi

Shembull konfigurimi pa sekrete: kopjoni `appsettings.Development.example.json` → `appsettings.Development.json` (nëse mungon) dhe plotësoni `Jwt:SigningKey` me User Secrets.

### 1. Connection string

Parazgjedhja në `appsettings.Development.json` përdor LocalDB:

```text
Server=(localdb)\mssqllocaldb;Database=SportsShopDb;...
```

Për databazë të përbashkët me ekipin, ndryshoni `ConnectionStrings:DefaultConnection` (mos e commit-oni fjalëkalimin në Git).

### 2. User Secrets (JWT — i detyrueshëm)

`Jwt:SigningKey` duhet të ketë **të paktën 32 byte** (p.sh. ~32+ karaktere). Vendosen me User Secrets (tashmë i konfiguruar `UserSecretsId` në `.csproj`):

Nga **rrënja e repo-s**:

```bash
dotnet user-secrets set "Jwt:SigningKey" "ErisSylejmani-SportsShop-DevKey-2026!" --project backend
```

Ose nga folderi `backend/` (pa `--project`):

```bash
cd backend
dotnet user-secrets set "Jwt:SigningKey" "ErisSylejmani-SportsShop-DevKey-2026!"
```

Opsionale (nëse nuk janë në `appsettings.Development.json`):

```bash
dotnet user-secrets set "Jwt:Issuer" "SportsShop.Api" --project backend
dotnet user-secrets set "Jwt:Audience" "SportsShop.Client" --project backend
```

### 3. CORS (frontend React / Vite)

Në **Development**, `appsettings.Development.json` lejon origjina si `http://localhost:5173`. Shtoni URL të reja në:

```json
"Cors": {
  "AllowedOrigins": [ "http://localhost:5173" ]
}
```

Në production, plotësoni `Cors:AllowedOrigins` në konfigurim të serverit (variabla mjedisi / App Service).

## Migrimet e databazës

Nga folderi `backend` (ose nga rrënja e repo-s):

```bash
# Krijo migrim të ri (pas ndryshimit të entiteteve)
dotnet ef migrations add EmriMigrimit --project backend

# Apliko migrimet në databazë
dotnet ef database update --project backend
```

Pas `database update`, nisja e API-s ekzekuton **seed** të roleve: `Admin`, `Manager`, `User`.

## Si ta nisni API-n

```bash
cd backend
dotnet run
```

| Profil | URL |
|--------|-----|
| HTTP | http://localhost:5079 |
| HTTPS | https://localhost:7051 |

- **Swagger UI:** http://localhost:5079/swagger (vetëm në Development)
- **Health:** GET http://localhost:5079/api/health

## Swagger me JWT

1. Hapni **Swagger UI** (`/swagger`).
2. **Regjistrim / login:**
   - `POST /api/auth/register` — krijon përdorues (roli `User` nëse `assignUserRole: true`).
   - `POST /api/auth/login` — përgjigja përmban `accessToken` dhe `refreshToken`.
3. Klikoni **Authorize** (dryni i gjelbër).
4. Futni **vetëm token-in** (pa prefiks `Bearer `) — Swagger e shton vetë skemën Bearer.
5. Provoni endpoint të mbrojtur, p.sh. `GET /api/me`.

### Refresh dhe logout

| Metoda | Rruta | Përshkrim |
|--------|--------|-----------|
| POST | `/api/auth/refresh` | Token i ri nga `refreshToken` |
| POST | `/api/auth/logout` | Revokon refresh token |
| POST | `/api/auth/revoke` | Revokon të gjitha refresh token-at e përdoruesit |

### Përdoruesi i parë Admin

Seed-i krijon vetëm **rolet**, jo përdorues Admin. Pas regjistrimit:

1. Regjistrohuni me `POST /api/auth/register`.
2. Në SSMS / Azure Data Studio, lidhuni me `SportsShopDb` dhe caktoni rolin Admin (shembull):

```sql
-- Zëvendësoni me Id të përdoruesit nga AspNetUsers
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id
FROM AspNetUsers u
CROSS JOIN AspNetRoles r
WHERE u.Email = 'admin@example.com' AND r.Name = 'Admin';
```

Ose përdorni `POST /api/admin/users` pasi të keni një Admin tjetër.

## Rolet dhe politikat

| Rol | Përshkrim i përgjithshëm |
|-----|-------------------------|
| **Admin** | Përdoruesit, rolet, caktimi i roleve; gjithashtu shkrim si Manager |
| **Manager** | CRUD shkrim për katalog, shitje, klientë, furnitorë, etj. |
| **User** | **Staf i dyqanit** (shitës/kasier): regjistron **shitje** dhe **kthime**, lexon të dhëna; nuk ndryshon/fshin shitje ose katalog |

Shkrimi për katalog/furnitorë/oferta përdor politika `*Shkrim` (Admin **ose** Manager). Shitje dhe kthime: Admin, Manager **ose** User (staf).

### Staf: punëtor + llogari login

`POST /api/punetoret` (Admin ose Manager) krijon **punëtorin** dhe **llogarinë** me rol `User`:

```json
{
  "emri": "Ana",
  "mbiemri": "Gashi",
  "pozita": "Shitese",
  "telefoni": "044123456",
  "email": "ana.gashi@dyqan.com",
  "password": "Fjalekalimi123!",
  "dataPunesimit": null,
  "paga": 450
}
```

Stafi logohet me `POST /api/auth/login`. `GET /api/me` kthen `punetorId`, `isStaff`. Në shitje, stafi regjistrohet automatikisht me `punetorId` të vet — nuk mund të zgjedhë punëtor tjetër.

Ekzekutoni migrimin `LinkApplicationUserPunetor` pas pull: `dotnet ef database update --project backend`.

## Modulet e API-s (CRUD)

| Modul | Bazë URL | Shënim |
|-------|----------|--------|
| Auth | `/api/auth/*`, `/api/me` | JWT |
| Admin përdorues | `/api/admin/users` | Vetëm Admin |
| Admin role | `/api/admin/roles` | Vetëm Admin |
| Kategori | `/api/kategorite` | |
| Produkte | `/api/produkte` | |
| Furnitorë | `/api/furnitore` | |
| Porosi furnitori | `/api/porosi-furnitore` | Me detaje rreshtash |
| Klientë | `/api/klientet` | |
| Punëtorë | `/api/punetoret` | |
| Shitje | `/api/shitjet` | + `/api/shitjet/{id}/detajet` |
| Kthime | `/api/kthimet` | Rregullon stokun |
| Ofertat | `/api/ofertat` | + `/api/ofertat/{id}/produktet` |

Dokumentimi i plotë i request/response: **Swagger** në development.

## Lidhja nga frontend (React)

```env
# frontend/.env
VITE_API_URL=http://localhost:5079
```

Shembull thirrjeje:

```javascript
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produkte`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

Sigurohuni që origjina e frontend-it (p.sh. `http://localhost:5173`) është në `Cors:AllowedOrigins`.

## Probleme të zakonshme

| Problem | Zgjidhje |
|---------|----------|
| `Jwt:SigningKey nuk është konfiguruar` | Vendosni User Secret (≥ 32 karaktere) |
| `IDX10720` / çelës i shkurtër | Zgjatni `Jwt:SigningKey` |
| 401 në Swagger | Authorize me token të ri pas login |
| 403 në POST/PUT/DELETE | Duhet rol Manager ose Admin |
| CORS nga browser | Shtoni URL-në e frontend-it në `Cors:AllowedOrigins` |
| `dotnet ef` nuk gjendet | `dotnet tool install --global dotnet-ef` |

## Komanda të shpejta

```bash
dotnet build
dotnet run --project backend
dotnet ef database update --project backend
```
