# Sports Shop Management System

Sistem për menaxhimin e një dyqani sportiv: inventar, shitje, furnitorë, klientë, kthime dhe oferta.

| **Backend** | .NET Web API, EF Core, MSSQL, JWT | **[backend/README.md](backend/README.md)** — nisja, secrets, migrime, Swagger |
| **Frontend** | React, Tailwind CSS | *(në zhvillim)* |

## Fillim i shpejtë (backend)

```bash
cd backend
dotnet user-secrets set "Jwt:SigningKey" "<çelës-i-gjatë-min-32-karaktere>" --project backend
dotnet ef database update --project backend
dotnet run --project backend
```

Hapni Swagger: http://localhost:5079/swagger

## Kërkesat e lëndës (përmbledhje)

- Autentifikim **JWT**, role **Admin / Manager / User**
- CRUD për produkte, kategori, furnitorë, porosi furnitori, klientë, punëtorë, shitje (me detaje), kthime, oferta
- **Dashboard** në frontend (obligativ)
- Dokumentacion i qartë API dhe përdorimi

Lista e plotë e entiteteve dhe kërkesave të detyrueshme të identitetit është në seksionin historik të projektit universitar; implementimi aktual i API-s përputhet me modulet e listuara në [backend/README.md](backend/README.md).

## Ekipi

- Pas `git pull`: `dotnet ef database update --project backend` nëse ka migrime të reja
- Të dhënat (produkte, klientë) **nuk** vijnë me Git — përdorni databazë të përbashkët ose seed / API
- Mos commit-oni fjalëkalime; përdorni **User Secrets** për JWT dhe connection string prod
