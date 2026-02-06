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

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("age")]
        public int Age { get; set; }

        [Column("gender")]
        public string? Gender { get; set; } // e.g., "Male", "Female", "Other"

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }
}
