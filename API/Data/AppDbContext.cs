using Microsoft.EntityFrameworkCore;
using ClariFi.API.Models;

namespace ClariFi.API.Data;

    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {

        // Models go here like this: public DbSet<foo> bar {get;set;}


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }