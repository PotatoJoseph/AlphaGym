using AlphaGymBackend.Data;
using AlphaGymBackend.Data.Entities;
using AlphaGymBackend.Services.Email;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Linq;

namespace AlphaGymBackend.Services.Auth
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }
        public async Task<string> LoginAsync(string email, string password)
        {
            Console.WriteLine($"[AUTH] Login attempt for: {email}");
            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);
            
            if (admin == null) 
            {
                Console.WriteLine($"[AUTH] User not found: {email}");
                return null;
            }

            Console.WriteLine($"[AUTH] User found, verifying password...");
            var ok = BCrypt.Net.BCrypt.Verify(password, admin.PasswordHash);
            
            if (!ok) 
            {
                Console.WriteLine($"[AUTH] Password verification failed for: {email}");
                return null;
            }

            Console.WriteLine($"[AUTH] Login successful for: {email}");
            return GenerateJwtToken(admin);
        }


        private string GenerateJwtToken(Admin admin)
        {
            var keyString = _configuration["Jwt:Key"] ?? "DEVELOPMENT_SECRET_KEY_DO_NOT_USE_IN_PRODUCTION";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, admin.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("id", admin.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(20),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
