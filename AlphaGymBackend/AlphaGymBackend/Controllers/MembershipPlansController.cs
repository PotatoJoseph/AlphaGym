using AlphaGymBackend.Data;
using AlphaGymBackend.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace AlphaGymBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MembershipPlansController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MembershipPlansController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _context.MembershipPlans.ToListAsync();
            return Ok(plans);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlan([FromBody] MembershipPlan plan)
        {
            plan.Id = Guid.NewGuid();
            _context.MembershipPlans.Add(plan);
            await _context.SaveChangesAsync();
            return Ok(plan);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] MembershipPlan plan)
        {
            var existing = await _context.MembershipPlans.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = plan.Name;
            existing.Cost = plan.Cost;
            existing.DurationDays = plan.DurationDays;
            existing.IsActive = plan.IsActive;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlan(Guid id)
        {
            var plan = await _context.MembershipPlans.FindAsync(id);
            if (plan == null) return NotFound();

            _context.MembershipPlans.Remove(plan);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Plan deleted" });
        }
    }
}
