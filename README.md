# Sportix — Sports Shop Management System

Ky repo është projekti ynë për menaxhimin e një dyqani sportiv: inventar, shitje, furnitorë, klientë, kthime dhe oferta. E kemi ndarë në **backend** (.NET API) dhe **frontend** (React).

Nëse sapo e keni klonuar projektin, lexoni këtë faqe një herë — pastaj hyni te README e backend-it dhe frontend-it për detaje.

## Çfarë përfshin

| Pjesa | Teknologji | Dokumentacion |
|-------|------------|---------------|
| **Backend** | .NET 10, EF Core, SQL Server, JWT | [backend/README.md](backend/README.md) |
| **Frontend** | React, Vite, TypeScript, Tailwind v4 | [frontend/README.md](frontend/README.md) |

**Rolet:** `Admin`, `Manager`, `User` (staf i dyqanit — shitës/kasier).

## Si ta nisim (lokalisht)

Duhen dy terminale: një për API-n, një për faqen.

### 1. Backend

```bash
cd backend
dotnet user-secrets set "Jwt:SigningKey" "ndrysho-kete-me-nje-fjalekalim-te-gjate-min-32-shkronja" 
dotnet ef database update
dotnet run
```

- Swagger: http://localhost:5079/swagger  
- Health: http://localhost:5079/api/health  

`Jwt:SigningKey` **duhet** të jetë i gjatë (rreth 32+ karaktere). Mos e vendosni në Git — përdorni User Secrets si më sipër.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Faqja: http://localhost:5173  
- Në `.env`: `VITE_API_URL=http://localhost:5079`

Backend-i duhet të jetë duke u ekzekutuar, përndryshe login dhe listat nuk funksionojnë.

## E rëndësishme për ekipin: Git vs databaza

`git pull` sjell **kodin** dhe **migrimet** (strukturën e tabelave). **Nuk** sjell produktet, klientët apo përdoruesit që dikush ka futur në laptopin e vet.

| Vjen me Git | Nuk vjen me Git |
|-------------|-----------------|
| Kodi, migrimet EF | Produktet, shitjet, klientët |
| Udhëzimet (README) | Përdoruesit në `AspNetUsers` |
| | Fjalëkalimet / të dhënat e demo |

Pra pas pull-it:

```bash
dotnet ef database update --project backend
```

…krijohen/përditësohen tabelat, por databaza lokale mbetet bosh për të dhëna, përveç roleve (`Admin`, `Manager`, `User`) që krijohen kur nisni API-n.

### Databazë e përbashkët (rekomandohet për ekip)

Nëse doni që të gjithë të shihni **të njëjtët** përdorues dhe produkte:

1. Vendosni një SQL Server të përbashkët (Azure SQL, SQL në një PC të ekipit, etj.).
2. Secili vendos **të njëjtin** connection string në User Secrets (jo në Git):

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Database=SportsShopDb;..." --project backend
```

3. Për të njëjtin login nga laptopë të ndryshëm, përdorni edhe **të njëjtin** `Jwt:SigningKey` në User Secrets (secili ekzekuton API-n lokale, por token-i duhet të nënshkruhet me të njëjtin çelës).
4. Një person bën `dotnet ef database update` kundrejt asaj DB; të tjerët vetëm lidhen.

Detaje në [backend/README.md](backend/README.md) (seksioni *Databazë e përbashkët me ekipin*).

## Pas çdo `git pull`

1. `dotnet ef database update --project backend` (nëse ka migrime të reja)  
2. Rinisni backend-in (ndaloni `dotnet run` i vjetër nëse DLL është i bllokuar)  
3. `npm install` në frontend vetëm nëse ka ndryshime në `package.json`  
4. Kontrolloni User Secrets (JWT + connection string)

## Moduli në një vështrim

- **Auth** — regjistrim, login, refresh token, `/api/me`  
- **Katalog** — kategori, produkte (stok)  
- **Furnitorë & porosi** — porosi furnitori me rreshta  
- **Klientë & punëtorë** — punëtori mund të lidhet me llogari `User`  
- **Shitje** — me detaje; stafi sheh vetëm shitjet e veta  
- **Kthime & oferta**  
- **Admin** — përdoruesit dhe rolet (vetëm Admin në UI)

## Kur ta vendosim online (website)

Atje nuk ka “databazë në laptop”. Ka **një** API + **një** databazë në server — të gjithë klientët e faqes përdorin të njëjtat të dhëna. Migrimet bëhen një herë në deploy, jo nga përdoruesit e web-it.

## Ndihmë e shpejtë

| Problem | Ku të shikoni |
|---------|----------------|
| API nuk niset / JWT | [backend/README.md](backend/README.md) |
| CORS / login nga browser | Origjina në `Cors:AllowedOrigins` + `VITE_API_URL` |
| Frontend bosh / 401 | A është backend-i duke u ekzekutuar? Token i skaduar? |
| `dotnet ef` nuk gjendet | `dotnet tool install --global dotnet-ef` |

---

Projekt universitar — dokumentacionin e mbajmë të përditësuar që ekipi të mos humbasë kohë me setup-in. Pyetje? Shkruani në grup ose hapni issue në repo.
