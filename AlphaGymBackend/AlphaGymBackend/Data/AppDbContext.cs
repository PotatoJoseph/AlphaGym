using AlphaGymBackend.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AlphaGymBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Admin> Admins { get; set; }
        public DbSet<AdminEmailOtp> AdminEmailOtps { get; set; }
        public DbSet<AccessCard> AccessCards { get; set; }
        public DbSet<DoorCommand> DoorCommands { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Member> Members { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Additional configuration if needed (e.g. indexes, constraints)
            modelBuilder.Entity<Admin>()
                .HasIndex(a => a.Email)
                .IsUnique();
                
            modelBuilder.Entity<Member>()
                .HasIndex(m => m.Email)
                .IsUnique();
                
            modelBuilder.Entity<AccessCard>()
                .HasIndex(c => c.CardNo)
                .IsUnique();
        }
    }
}
