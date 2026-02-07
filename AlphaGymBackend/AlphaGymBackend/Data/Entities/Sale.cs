using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlphaGymBackend.Data.Entities
{
    [Table("sales")]
    public class Sale
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("member_id")]
        public Guid? MemberId { get; set; } // Nullable if generic sale

        [Required]
        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Required]
        [Column("payment_method")]
        public required string PaymentMethod { get; set; } // Cash, Card

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("MemberId")]
        public Member? Member { get; set; }

        public ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
    }
}
