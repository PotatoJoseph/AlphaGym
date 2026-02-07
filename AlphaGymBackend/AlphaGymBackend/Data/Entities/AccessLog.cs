using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlphaGymBackend.Data.Entities
{
    [Table("access_logs")]
    public class AccessLog
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("member_id")]
        public Guid? MemberId { get; set; }

        [Required]
        [Column("card_uid")]
        public required string CardUid { get; set; }

        [Required]
        [Column("full_name")]
        public string? FullName { get; set; }

        [Required]
        [Column("action")]
        public required string Action { get; set; } // Opening door, Blocked (Expired), etc.

        [Required]
        [Column("time")]
        public DateTime Time { get; set; } = DateTime.UtcNow;

        [Column("subscription_status")]
        public string? SubscriptionStatus { get; set; } // Active, Expired, Grace Period
    }
}
