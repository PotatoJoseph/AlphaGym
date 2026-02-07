using AlphaGymBackend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AlphaGymBackend.Services;
using AlphaGymBackend.Services.Hikvision;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Frontend URL
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


// Services
builder.Services.AddScoped<AlphaGymBackend.Services.Email.IEmailService, AlphaGymBackend.Services.Email.EmailService>();
builder.Services.AddScoped<AlphaGymBackend.Services.Auth.AuthService>();
builder.Services.AddSingleton<AlphaGymBackend.Services.Hikvision.HikvisionService>();
builder.Services.AddSingleton<AccessControlService>(); // Added AccessControlService

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AlphaGymBackend",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AlphaGymUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "DEVELOPMENT_SECRET_KEY_DO_NOT_USE_IN_PRODUCTION"))
        };
    });

var app = builder.Build();

// Ensure singleton services that listen to events are started
app.Services.GetRequiredService<AccessControlService>();
app.Services.GetRequiredService<HikvisionService>().Login();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
