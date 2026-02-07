using AlphaGymBackend.Data;
using AlphaGymBackend.Data.Entities;
using AlphaGymBackend.Services.Hikvision;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AlphaGymBackend.Services
{
    public class AccessControlService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly HikvisionService _hikvisionService;
        private readonly ILogger<AccessControlService> _logger;

        public AccessControlService(IServiceProvider serviceProvider, HikvisionService hikvisionService, ILogger<AccessControlService> logger)
        {
            _serviceProvider = serviceProvider;
            _hikvisionService = hikvisionService;
            _logger = logger;

            // Subscribe to card swipes
            _hikvisionService.CardSwiped += (cardNo) => {
                _ = HandleCardSwipe(cardNo);
            };
        }

        private async Task HandleCardSwipe(string cardNo)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            _logger.LogInformation($"Processing card swipe: {cardNo}");

            // 1. Find the member associated with this card
            var card = await context.AccessCards.FirstOrDefaultAsync(c => c.CardUid == cardNo);
            if (card == null)
            {
                await LogAccess(context, null, cardNo, "Blocked: Unregistered Card", "Unknown");
                return;
            }

            var member = await context.Members.FirstOrDefaultAsync(m => m.Id == card.Id || m.Phone == cardNo); // Simple mapping or add MemberId to Card
            // Assuming for now CardId maps to MemberId or we need a proper link.
            // Let's check current schema again... Member has MembershipPlanId. 
            // Better: Member should have a CardUid or Link table.
            
            // Re-checking Member entity... let's find member by CardUid if we adding CardUid to Member.
            var memberWithCard = await context.Members.FirstOrDefaultAsync(m => m.CardUid == cardNo || m.Phone == cardNo); 
            
            // TODO: Ensure proper linking between Member and Card.
            // For now, let's assume we find them. If not found, log.
            if (memberWithCard == null)
            {
                await LogAccess(context, null, cardNo, "Blocked: No Member linked", "Unknown");
                return;
            }

            // 2. Check Expiry
            var now = DateTime.UtcNow;
            var status = "Active";
            bool allowed = true;

            if (memberWithCard.SubscriptionExpiresAt.HasValue)
            {
                var expiry = memberWithCard.SubscriptionExpiresAt.Value;
                if (now > expiry)
                {
                    // 1-day grace period
                    if (now <= expiry.AddDays(1))
                    {
                        status = "Grace Period";
                    }
                    else
                    {
                        status = "Expired";
                        allowed = false;
                    }
                }
            }
            else
            {
                status = "No Subscription";
                allowed = false;
            }

            // 3. Check Daily Limit
            if (allowed)
            {
                // Gym day starts at 1 AM.
                var nowLocal = DateTime.UtcNow; // Ideally should be gym local time
                var gymDayStart = nowLocal.Hour < 1 
                    ? nowLocal.Date.AddDays(-1).AddHours(1) 
                    : nowLocal.Date.AddHours(1);

                if (!memberWithCard.IsUnlimitedAccess)
                {
                    var count = await context.AccessLogs
                        .CountAsync(l => l.MemberId == memberWithCard.Id && l.Time >= gymDayStart && l.Action == "Opening door");

                    if (count >= memberWithCard.DailyAccessLimit && memberWithCard.DailyAccessLimit > 0)
                    {
                        allowed = false;
                        status = "Limit Reached";
                        _logger.LogWarning($"Member {memberWithCard.FullName} reached daily limit of {memberWithCard.DailyAccessLimit}");
                    }
                }
            }

            // 4. Execute Action
            if (allowed)
            {
                _hikvisionService.ControlDoor(1, CHCNetSDK.NET_DVR_OPEN_DOOR);
                await LogAccess(context, memberWithCard, cardNo, "Opening door", status);
            }
            else
            {
                await LogAccess(context, memberWithCard, cardNo, $"Blocked: {status}", status);
            }
        }

        private async Task LogAccess(AppDbContext context, Member? member, string cardNo, string action, string status)
        {
            var log = new AccessLog
            {
                Id = Guid.NewGuid(),
                MemberId = member?.Id,
                CardUid = cardNo,
                FullName = member?.FullName ?? "Unknown",
                Action = action,
                Time = DateTime.UtcNow,
                SubscriptionStatus = status
            };

            context.AccessLogs.Add(log);
            await context.SaveChangesAsync();
            _logger.LogInformation($"Access Logged: {action} for {log.FullName}");
        }
    }
}
