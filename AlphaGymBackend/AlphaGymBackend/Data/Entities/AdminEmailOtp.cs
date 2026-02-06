using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlphaGymBackend.Data.Entities
{
    [Table("admin_email_otps")]
    public class AdminEmailOtp
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("admin_id")]
        public Guid AdminId { get; set; }

        [Required]
        [Column("code_hash")] // Storing plain code for demo if needed, but schema says hash.
        public required string CodeHash { get; set; }

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("consumed_at")]
        public DateTime? ConsumedAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
