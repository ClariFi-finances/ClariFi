using API.Data;
using API.Features.Categories;
using API.Infrastructure.Repositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace API.Tests.Features;

public class CategoryHandlersTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly Repository<Category> _categoryRepo;
    private readonly CategoryHandlers _handler;

    public CategoryHandlersTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        
        _categoryRepo = new Repository<Category>(_context);
        _handler = new CategoryHandlers(_categoryRepo);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task AddCategory_ShouldCreateCategory()
    {
        // Arrange
        var command = new AddCategoryCommand("Test Category", "🎨", "#FF0000", 1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Category", result.Name);
        Assert.Equal("🎨", result.Icon);
        Assert.Equal("#FF0000", result.Color);
        Assert.Equal(1, result.UserId);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task GetCategories_ShouldReturnAllCategories_WhenUserIdIsNull()
    {
        // Arrange
        var c1 = new Category("Cat 1", "icon1", "color1", 1);
        var c2 = new Category("Cat 2", "icon2", "color2", 2);
        await _categoryRepo.AddAsync(c1);
        await _categoryRepo.AddAsync(c2);
        await _categoryRepo.SaveChangesAsync();

        var query = new GetCategoriesQuery(UserId: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetCategories_ShouldReturnOnlyUserCategories_WhenUserIdIsSpecified()
    {
        // Arrange
        var c1 = new Category("Cat 1", "icon1", "color1", 1);
        var c2 = new Category("Cat 2", "icon2", "color2", 2);
        await _categoryRepo.AddAsync(c1);
        await _categoryRepo.AddAsync(c2);
        await _categoryRepo.SaveChangesAsync();

        var query = new GetCategoriesQuery(UserId: 1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var list = result.ToList();
        Assert.Single(list);
        Assert.Equal("Cat 1", list[0].Name);
    }

    [Fact]
    public async Task UpdateCategory_ShouldModifyDetails_WhenCategoryExists()
    {
        // Arrange
        var category = new Category("Old Name", "old-icon", "old-col", 1);
        await _categoryRepo.AddAsync(category);
        await _categoryRepo.SaveChangesAsync();

        var command = new UpdateCategoryCommand(category.Id, "New Name", "new-icon", "new-col");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var updated = await _context.Categories.FindAsync(category.Id);
        Assert.NotNull(updated);
        Assert.Equal("New Name", updated!.Name);
        Assert.Equal("new-icon", updated.Icon);
        Assert.Equal("new-col", updated.Color);
    }

    [Fact]
    public async Task UpdateCategory_ShouldReturnFalse_WhenCategoryDoesNotExist()
    {
        // Arrange
        var command = new UpdateCategoryCommand(999, "New Name", "new-icon", "new-col");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task RemoveCategory_ShouldDeleteCategory_WhenCategoryExists()
    {
        // Arrange
        var category = new Category("To Delete", "icon", "color", 1);
        await _categoryRepo.AddAsync(category);
        await _categoryRepo.SaveChangesAsync();

        var command = new RemoveCategoryCommand(category.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var search = await _context.Categories.FindAsync(category.Id);
        Assert.Null(search);
    }

    [Fact]
    public async Task RemoveCategory_ShouldReturnFalse_WhenCategoryDoesNotExist()
    {
        // Arrange
        var command = new RemoveCategoryCommand(999);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}
