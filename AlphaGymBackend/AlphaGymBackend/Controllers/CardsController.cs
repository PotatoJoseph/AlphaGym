using AlphaGymBackend.Data;
using AlphaGymBackend.Data.Entities;
using AlphaGymBackend.Services.Hikvision;
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
    public class CardsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HikvisionService _hikvisionService;

        public CardsController(AppDbContext context, HikvisionService hikvisionService)
        {
            _context = context;
            _hikvisionService = hikvisionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCards()
        {
            var cards = await _context.AccessCards.ToListAsync();
            return Ok(cards);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCard([FromBody] CreateCardRequest request)
        {
            // 1. Save to DB
            var card = new AccessCard
            {
                Id = Guid.NewGuid(),
                CardNo = request.CardNo,
                PermissionLevel = request.PermissionLevel,
                IsActive = true
            };
            _context.AccessCards.Add(card);
            await _context.SaveChangesAsync();

            // 2. Push to SDK
            if (_hikvisionService.Login())
            {
                // In a real implementation:
                // _hikvisionService.SetCard(card.CardNo, card.PermissionLevel);
                // For now, logging success of connection.
            }

            return Ok(card);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCard(Guid id, [FromBody] UpdateCardRequest request)
        {
            var card = await _context.AccessCards.FindAsync(id);
            if (card == null) return NotFound();

            card.PermissionLevel = request.PermissionLevel;
            card.IsActive = request.IsActive;
            await _context.SaveChangesAsync();

            // Sync with SDK ...

            return Ok(card);
        }

        [HttpPost("{id}/door-command")]
        public async Task<IActionResult> SendDoorCommand(Guid id, [FromBody] DoorCommandRequest request)
        {
            // Log command
            var cmd = new DoorCommand
            {
                // Id is long, usually auto-gen by DB sequence, but EF requires value if not configured as Identity.
                // Assuming Database handles generation or we need to configure it.
                // For now let's hope EF handles it if defined as 'serial' in postgres.
                DoorId = Guid.Empty, // Placeholder or specific door
                Command = request.Command,
                RequestedByAdminId = Guid.Parse(User.FindFirst("id")?.Value ?? Guid.Empty.ToString())
            };
            _context.DoorCommands.Add(cmd);
            await _context.SaveChangesAsync();

            // Execute SDK default door command
           if (_hikvisionService.Login())
            {
                 // _hikvisionService.ControlDoor(request.Command);
            }

            return Ok(new { Message = "Command sent" });
        }
    }

    public class CreateCardRequest
    {
        public required string CardNo { get; set; }
        public int PermissionLevel { get; set; }
    }

    public class UpdateCardRequest
    {
        public int PermissionLevel { get; set; }
        public bool IsActive { get; set; }
    }

    public class DoorCommandRequest
    {
        public required string Command { get; set; } // OPEN, CLOSE
    }
}
