using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Category> Categories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<API.Models.User>(entity => 
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CognitoId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Cpf).IsRequired().HasMaxLength(11);
            entity.HasIndex(e => e.Cpf).IsUnique();
            entity.HasIndex(e => e.CognitoId).IsUnique();
        });

        modelBuilder.Entity<API.Models.PaymentMethod>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.UserId).IsRequired();
        });

        modelBuilder.Entity<API.Models.Transaction>(entity =>
        {
            entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Amount).IsRequired();
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.CategoryId).IsRequired();
            entity.Property(e => e.InstallmentInfo).HasMaxLength(255);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.PaymentMethodId).IsRequired();
        });

        modelBuilder.Entity<API.Models.Category>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Icon).HasMaxLength(255);
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.UserId).IsRequired();
        });

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
