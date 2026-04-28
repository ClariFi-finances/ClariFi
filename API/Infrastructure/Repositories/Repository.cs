using API.Data;
using API.Models;
using Microsoft.EntityFrameworkCore;

namespace API.Infrastructure.Repositories;

public class Repository<T>(AppDbContext context) : IRepository<T> where T : BaseEntity
{
    public async Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default) 
        => await context.Set<T>().FindAsync([id], cancellationToken);
    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default) 
        => await context.Set<T>().AsNoTracking().ToListAsync(cancellationToken);
    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) 
        => await context.Set<T>().AddAsync(entity, cancellationToken);
    public Task UpdateAsync(T entity)
        => Task.FromResult(context.Set<T>().Update(entity));
    public Task DeleteAsync(T entity) 
        => Task.FromResult(context.Set<T>().Remove(entity));
    public async Task SaveChangesAsync(CancellationToken cancellationToken = default) 
        => await context.SaveChangesAsync(cancellationToken);
}

