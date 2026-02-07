using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlphaGymBackend.Data.Entities
{
    [Table("members")]
    public class Member
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("full_name")]
        public required string FullName { get; set; }

        [EmailAddress]
        [Column("email")]
        public string? Email { get; set; }

        [Column("card_uid")]
        public string? CardUid { get; set; }

        [Column("is_unlimited_access")]
        public bool IsUnlimitedAccess { get; set; } = false;

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("age")]
        public int Age { get; set; }

        [Column("gender")]
        public string? Gender { get; set; } // e.g., "Male", "Female", "Other"

        [Column("photo_url")]
        public string? PhotoUrl { get; set; }

        [Column("membership_plan_id")]
        public Guid? MembershipPlanId { get; set; }

        [Column("payment_method")]
        public string? PaymentMethod { get; set; } // Cash, Card

        [Column("daily_access_limit")]
        public int DailyAccessLimit { get; set; } = 1;

        [Column("subscription_expires_at")]
        public DateTime? SubscriptionExpiresAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [ForeignKey("MembershipPlanId")]
        public MembershipPlan? MembershipPlan { get; set; }
    }
}
