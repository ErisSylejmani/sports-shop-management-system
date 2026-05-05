using System.Text;
using backend.Contracts.Auth;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Lidhja 'DefaultConnection' nuk u gjet në konfigurim.");

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSigningKey = jwtSection["SigningKey"];
if (string.IsNullOrWhiteSpace(jwtSigningKey))
{
    throw new InvalidOperationException(
        "Jwt:SigningKey nuk është konfiguruar. Për development: dotnet user-secrets set \"Jwt:SigningKey\" \"<string i gjatë>\" --project backend");
}

// HS256 me IdentityModel 8.x: çelësi duhet >256 bit (së paku 32 byte UTF-8); përndryshe IDX10720.
const int minSigningKeyBytes = 32;
var signingKeyByteCount = Encoding.UTF8.GetByteCount(jwtSigningKey);
if (signingKeyByteCount < minSigningKeyBytes)
{
    throw new InvalidOperationException(
        $"Jwt:SigningKey është shumë i shkurtër ({signingKeyByteCount} byte, duhen së paku {minSigningKeyBytes}). " +
        "Shembull: dotnet user-secrets set \"Jwt:SigningKey\" \"ErisSylejmani-SportsShop-DevKey-2026!\" --project backend");
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

builder.Services.AddSingleton<AccessTokenService>();
builder.Services.AddScoped<RefreshTokenService>();

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

app.MapGet(
        "/api/me",
        async Task<IResult> (UserManager<ApplicationUser> userManager, HttpContext httpContext) =>
        {
            var user = await userManager.GetUserAsync(httpContext.User);
            if (user is null)
                return Results.Unauthorized();

            var roles = await userManager.GetRolesAsync(user);
            return Results.Ok(new
            {
                user.Id,
                user.Email,
                user.Emri,
                user.Mbiemri,
                user.PhoneNumber,
                user.EshteAktiv,
                Roles = roles
            });
        })
    .RequireAuthorization()
    .WithTags("Auth");

app.MapGet("/api/roles", async (RoleManager<IdentityRole<Guid>> roleManager) =>
    {
        var roles = await roleManager.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new { r.Id, r.Name, r.NormalizedName })
            .ToListAsync();
        return Results.Ok(roles);
    })
    .RequireAuthorization(policy => policy.RequireRole("Admin"))
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

app.MapPost(
        "/api/auth/login",
        async Task<IResult> (
            LoginRequest body,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            AppDbContext db,
            AccessTokenService tokenService,
            IConfiguration configuration) =>
        {
            var email = body.Email.Trim();
            var user = await userManager.FindByEmailAsync(email);
            if (user is null || !user.EshteAktiv)
            {
                return Results.Json(
                    new { message = "Email ose fjalëkalim i gabuar." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            var check = await signInManager.CheckPasswordSignInAsync(user, body.Password, lockoutOnFailure: true);
            if (check.IsLockedOut)
            {
                return Results.Json(
                    new { message = "Llogaria është e bllokuar. Provoni më vonë." },
                    statusCode: StatusCodes.Status423Locked);
            }

            if (!check.Succeeded)
            {
                return Results.Json(
                    new { message = "Email ose fjalëkalim i gabuar." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            var roleNames = await userManager.GetRolesAsync(user);
            var (accessToken, accessExpiresAt) = tokenService.CreateAccessToken(user, roleNames);

            var refreshValue = AccessTokenService.CreateRefreshTokenValue();
            var refreshDays = int.TryParse(configuration["Jwt:RefreshTokenDays"], out var rd) ? rd : 7;
            var refreshExpires = DateTime.UtcNow.AddDays(refreshDays);

            db.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshValue,
                Expires = refreshExpires,
                Created = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var response = new AuthResponse(
                accessToken,
                refreshValue,
                accessExpiresAt,
                new DateTimeOffset(refreshExpires, TimeSpan.Zero),
                user.Id,
                user.Email ?? email,
                user.Emri,
                user.Mbiemri,
                roleNames.ToList());

            return Results.Ok(response);
        })
    .AllowAnonymous()
    .WithTags("Auth");

app.MapPost(
        "/api/auth/refresh",
        async Task<IResult> (RefreshRequest body, RefreshTokenService refreshService, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(body.RefreshToken))
            {
                return Results.BadRequest(new { message = "RefreshToken është i detyrueshëm." });
            }

            var response = await refreshService.TryRefreshAsync(body.RefreshToken, cancellationToken);
            if (response is null)
            {
                return Results.Json(
                    new { message = "Refresh token i pavlefshëm ose i skaduar." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            return Results.Ok(response);
        })
    .AllowAnonymous()
    .WithTags("Auth");

app.MapPost(
        "/api/auth/logout",
        async Task<IResult> (RefreshRequest body, RefreshTokenService refreshService, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(body.RefreshToken))
            {
                return Results.BadRequest(new { message = "RefreshToken është i detyrueshëm." });
            }

            var revoked = await refreshService.TryRevokeAsync(body.RefreshToken, cancellationToken);
            if (!revoked)
            {
                return Results.Json(
                    new { message = "Refresh token i pavlefshëm ose i revokuar." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            return Results.Ok(new { message = "Logout u krye me sukses." });
        })
    .AllowAnonymous()
    .WithTags("Auth");

app.MapPost(
        "/api/auth/revoke",
        async Task<IResult> (RefreshRequest body, RefreshTokenService refreshService, CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(body.RefreshToken))
            {
                return Results.BadRequest(new { message = "RefreshToken është i detyrueshëm." });
            }

            var revoked = await refreshService.TryRevokeAsync(body.RefreshToken, cancellationToken);
            if (!revoked)
            {
                return Results.Json(
                    new { message = "Refresh token i pavlefshëm ose i revokuar." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            return Results.Ok(new { message = "Refresh token u revokua me sukses." });
        })
    .AllowAnonymous()
    .WithTags("Auth");

await RoleSeeder.SeedDefaultRolesAsync(app.Services);

app.Run();
