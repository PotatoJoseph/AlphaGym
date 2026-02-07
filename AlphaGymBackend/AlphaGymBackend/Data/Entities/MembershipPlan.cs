using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlphaGymBackend.Data.Entities
{
    [Table("membership_plans")]
    public class MembershipPlan
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("name")]
        public required string Name { get; set; } // Yearly, Monthly, Daily

        [Required]
        [Column("cost")]
        public decimal Cost { get; set; }

        [Required]
        [Column("duration_days")]
        public int DurationDays { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }
}
