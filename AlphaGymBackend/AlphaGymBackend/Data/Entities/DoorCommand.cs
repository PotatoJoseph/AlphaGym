using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlphaGymBackend.Data.Entities
{
    [Table("door_commands")]
    public class DoorCommand
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("door_id")]
        public Guid DoorId { get; set; } // Could be an FK to a Doors table if it exists

        [Required]
        [Column("command")]
        public required string Command { get; set; } // OPEN, CLOSE

        [Column("requested_by_admin_id")]
        public Guid? RequestedByAdminId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
