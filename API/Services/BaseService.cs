using Microsoft.EntityFrameworkCore;
using ClariFi.API.Data;
using ClariFi.API.Models;
using ClariFi.API.Services.Interfaces;

namespace ClariFi.API.Services;

public class BaseService<T>(AppDbContext context) : IBaseService<T> where T : class, IEntity
{
    protected readonly AppDbContext _context = context;

    public virtual async Task<IEnumerable<T>> GetAllAsync() => await _context.Set<T>().ToListAsync();

    public virtual async Task<T?> GetByIdAsync(int id, params string[] includes)
    {
        var query = _context.Set<T>().AsQueryable();
        foreach (var include in includes) query = query.Include(include);
        return await query.FirstOrDefaultAsync(e => e.Id == id);
    }

    public virtual async Task<T> CreateAsync(T entity)
    {
        _context.Set<T>().Add(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task<bool> UpdateAsync(int id, T entity)
    {
        if (id != entity.Id) return false;

        _context.Entry(entity).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Set<T>().AnyAsync(e => e.Id == id)) return false;
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        if (await _context.Set<T>().FindAsync(id) is not T entity) return false;

        _context.Set<T>().Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }
}