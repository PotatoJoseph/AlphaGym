using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlphaGymBackend.Data.Entities
{
    [Table("access_cards")]
    public class AccessCard
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("card_no")]
        public required string CardNo { get; set; } = string.Empty;

        // Can map other fields from alphadb.sql if known, for now minimal.
        
        [Column("permission_level")]
        public int PermissionLevel { get; set; } // Example: 0=None, 1=Basic, 9=Admin

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
