using AlphaGymBackend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace AlphaGymBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AccessLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AccessLogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _context.AccessLogs
                .OrderByDescending(l => l.Time)
                .Take(50)
                .ToListAsync();
            return Ok(logs);
        }
    }
}
