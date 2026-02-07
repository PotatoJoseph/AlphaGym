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
    public class SalesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SalesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSales()
        {
            var sales = await _context.Sales
                .Include(s => s.Member)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            return Ok(sales);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSale([FromBody] CreateSaleRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var sale = new Sale
                {
                    Id = Guid.NewGuid(),
                    MemberId = request.MemberId,
                    TotalAmount = request.TotalAmount,
                    PaymentMethod = request.PaymentMethod,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Sales.Add(sale);

                foreach (var item in request.Items)
                {
                    var saleItem = new SaleItem
                    {
                        Id = Guid.NewGuid(),
                        SaleId = sale.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Price
                    };
                    _context.SaleItems.Add(saleItem);

                    // If the item is a "Membership" (special product or detected by name/logic)
                    // we update the member's subscription.
                    // For now, let's assume we have a simpler logic or a specific plan ID in the request.
                }

                // If a Membership Plan ID is provided specifically to renew
                if (request.MembershipPlanId.HasValue && request.MemberId.HasValue)
                {
                    var member = await _context.Members.FindAsync(request.MemberId.Value);
                    var plan = await _context.MembershipPlans.FindAsync(request.MembershipPlanId.Value);
                    
                    if (member != null && plan != null)
                    {
                        member.MembershipPlanId = plan.Id;
                        var currentExpiry = member.SubscriptionExpiresAt ?? DateTime.UtcNow;
                        if (currentExpiry < DateTime.UtcNow) currentExpiry = DateTime.UtcNow;
                        
                        member.SubscriptionExpiresAt = currentExpiry.AddDays(plan.DurationDays);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(sale);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Message = "Failed to create sale", Error = ex.Message });
            }
        }
    }

    public class CreateSaleRequest
    {
        public Guid? MemberId { get; set; }
        public decimal TotalAmount { get; set; }
        public required string PaymentMethod { get; set; }
        public List<SaleItemRequest> Items { get; set; } = new();
        public Guid? MembershipPlanId { get; set; } // Optional: if this sale updates a membership
    }

    public class SaleItemRequest
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
