using API.Data;
using API.Models;
using Microsoft.EntityFrameworkCore;

namespace API.Infrastructure.Repositories;

public class Repository<T>(AppDbContext context) : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context = context;
    public async Task<T?> GetByIdAsync(int id) => await _context.Set<T>().FindAsync(id);
    public async Task<IEnumerable<T>> GetAllAsync() => await _context.Set<T>().ToListAsync();
    public async Task AddAsync(T entity) => await _context.Set<T>().AddAsync(entity);
    public Task UpdateAsync(T entity) { _context.Set<T>().Update(entity); return Task.CompletedTask; }
    public Task DeleteAsync(T entity) { _context.Set<T>().Remove(entity); return Task.CompletedTask; }
    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}

