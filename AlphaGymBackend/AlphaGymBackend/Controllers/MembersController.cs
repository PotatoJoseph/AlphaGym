using AlphaGymBackend.Data;
using AlphaGymBackend.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AlphaGymBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MembersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MembersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMembers()
        {
            var members = await _context.Members
                .Include(m => m.MembershipPlan)
                .ToListAsync();
            return Ok(members);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMember(Guid id)
        {
            var member = await _context.Members
                .Include(m => m.MembershipPlan)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (member == null) return NotFound();
            return Ok(member);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMember([FromBody] CreateMemberRequest request)
        {
            var member = new Member
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Age = request.Age,
                Gender = request.Gender,
                PhotoUrl = request.PhotoUrl,
                MembershipPlanId = request.MembershipPlanId,
                PaymentMethod = request.PaymentMethod,
                DailyAccessLimit = request.DailyAccessLimit,
                SubscriptionExpiresAt = request.SubscriptionExpiresAt,
                CardUid = request.CardUid,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            return Ok(member);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMember(Guid id, [FromBody] UpdateMemberRequest request)
        {
            var member = await _context.Members.FindAsync(id);
            if (member == null) return NotFound();

            member.FullName = request.FullName;
            member.Email = request.Email;
            member.Phone = request.Phone;
            member.Age = request.Age;
            member.Gender = request.Gender;
            member.PhotoUrl = request.PhotoUrl;
            member.MembershipPlanId = request.MembershipPlanId;
            member.PaymentMethod = request.PaymentMethod;
            member.DailyAccessLimit = request.DailyAccessLimit;
            member.SubscriptionExpiresAt = request.SubscriptionExpiresAt;
            member.CardUid = request.CardUid;
            member.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(member);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMember(Guid id)
        {
            var member = await _context.Members.FindAsync(id);
            if (member == null) return NotFound();

            _context.Members.Remove(member);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Member deleted" });
        }
    }

    public class CreateMemberRequest
    {
        public required string FullName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public int Age { get; set; }
        public string? Gender { get; set; }
        public string? PhotoUrl { get; set; }
        public Guid? MembershipPlanId { get; set; }
        public string? PaymentMethod { get; set; }
        public int DailyAccessLimit { get; set; } = 1;
        public DateTime? SubscriptionExpiresAt { get; set; }
        public string? CardUid { get; set; }
    }

    public class UpdateMemberRequest : CreateMemberRequest
    {
        public bool IsActive { get; set; }
    }
}
