using System.Text;
using backend.Contracts.Auth;
using backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Lidhja 'DefaultConnection' nuk u gjet në konfigurim.");

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSigningKey = jwtSection["SigningKey"];
if (string.IsNullOrWhiteSpace(jwtSigningKey))
{
    throw new InvalidOperationException(
        "Jwt:SigningKey nuk është konfiguruar. Për development vendoseni me: dotnet user-secrets set \"Jwt:SigningKey\" \"<çelës-i-gjatë>\" --project backend");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sports Shop API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description =
            "JWT Authorization header përmes skemës Bearer. Fut vetëm token-in (pa prefiks \"Bearer \")."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", message = "API dhe konfigurimi bazë janë aktivë." }));

app.MapGet("/api/roles", async (RoleManager<IdentityRole<Guid>> roleManager) =>
    {
        var roles = await roleManager.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new { r.Id, r.Name, r.NormalizedName })
            .ToListAsync();
        return Results.Ok(roles);
    })
    .WithTags("Test");

app.MapPost(
        "/api/auth/register",
        async Task<IResult> (
            RegisterRequest body,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager) =>
        {
            var user = new ApplicationUser
            {
                UserName = body.Email,
                Email = body.Email,
                Emri = body.Emri,
                Mbiemri = body.Mbiemri,
                PhoneNumber = string.IsNullOrWhiteSpace(body.PhoneNumber) ? null : body.PhoneNumber.Trim(),
                EmailConfirmed = false,
                EshteAktiv = true,
                DataKrijimit = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(user, body.Password);
            if (!createResult.Succeeded)
            {
                return Results.BadRequest(new
                {
                    message = "Regjistrimi dështoi.",
                    errors = createResult.Errors.Select(e => e.Description).ToArray()
                });
            }

            if (body.AssignUserRole)
            {
                if (!await roleManager.RoleExistsAsync("User"))
                {
                    await userManager.DeleteAsync(user);
                    return Results.Problem(
                        detail: "Roli 'User' nuk ekziston. Ekzekuto seed-in e roleve.",
                        statusCode: StatusCodes.Status500InternalServerError);
                }

                var roleResult = await userManager.AddToRoleAsync(user, "User");
                if (!roleResult.Succeeded)
                {
                    await userManager.DeleteAsync(user);
                    return Results.BadRequest(new
                    {
                        message = "Caktimi i rolit dështoi.",
                        errors = roleResult.Errors.Select(e => e.Description).ToArray()
                    });
                }
            }

            var roles = await userManager.GetRolesAsync(user);
            var response = new RegisterResponse(
                user.Id,
                user.Email ?? body.Email,
                user.Emri,
                user.Mbiemri,
                roles.ToList());

            return Results.Created($"/api/users/{user.Id}", response);
        })
    .AllowAnonymous()
    .WithTags("Auth");

await RoleSeeder.SeedDefaultRolesAsync(app.Services);

app.Run();
