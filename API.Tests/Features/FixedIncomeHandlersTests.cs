using API.Data;
using API.Features.FixedIncomes;
using API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace API.Tests.Features;

public class FixedIncomeHandlersTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly GetUserFixedIncomesHandler _getHandler;
    private readonly CreateFixedIncomeHandler _createHandler;
    private readonly UpdateFixedIncomeHandler _updateHandler;
    private readonly DeleteFixedIncomeHandler _deleteHandler;

    public FixedIncomeHandlersTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _getHandler = new GetUserFixedIncomesHandler(_context);
        _createHandler = new CreateFixedIncomeHandler(_context);
        _updateHandler = new UpdateFixedIncomeHandler(_context);
        _deleteHandler = new DeleteFixedIncomeHandler(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateFixedIncome_ShouldCreateFixedIncomeSuccessfully()
    {
        // Arrange
        var command = new CreateFixedIncomeCommand("Salary", 5000m, 5, 1);

        // Act
        var result = await _createHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Salary", result.Name);
        Assert.Equal(5000m, result.Amount);
        Assert.Equal(5, result.DayOfMonth);
        Assert.Equal(1, result.UserId);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task GetUserFixedIncomes_ShouldReturnOrderedFixedIncomesForUser()
    {
        // Arrange
        var f1 = new FixedIncome("Salary", 5000m, 5, 1);
        var f2 = new FixedIncome("Freelance", 1000m, 15, 1);
        var f3 = new FixedIncome("Other User Salary", 4000m, 10, 2);

        _context.FixedIncomes.AddRange(f1, f2, f3);
        await _context.SaveChangesAsync();

        var query = new GetUserFixedIncomesQuery(1);

        // Act
        var result = await _getHandler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Salary", result[0].Name);
        Assert.Equal("Freelance", result[1].Name);
    }

    [Fact]
    public async Task UpdateFixedIncome_ShouldModifyFixedIncome_WhenExists()
    {
        // Arrange
        var f = new FixedIncome("Salary", 5000m, 5, 1);
        _context.FixedIncomes.Add(f);
        await _context.SaveChangesAsync();

        var command = new UpdateFixedIncomeCommand(f.Id, "Salary Updated", 5500m, 6);

        // Act
        var result = await _updateHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var updated = await _context.FixedIncomes.FindAsync(f.Id);
        Assert.NotNull(updated);
        Assert.Equal("Salary Updated", updated!.Name);
        Assert.Equal(5500m, updated.Amount);
        Assert.Equal(6, updated.DayOfMonth);
    }

    [Fact]
    public async Task UpdateFixedIncome_ShouldReturnFalse_WhenDoesNotExist()
    {
        // Arrange
        var command = new UpdateFixedIncomeCommand(999, "Salary Updated", 5500m, 6);

        // Act
        var result = await _updateHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteFixedIncome_ShouldRemove_WhenExists()
    {
        // Arrange
        var f = new FixedIncome("Salary", 5000m, 5, 1);
        _context.FixedIncomes.Add(f);
        await _context.SaveChangesAsync();

        var command = new DeleteFixedIncomeCommand(f.Id);

        // Act
        var result = await _deleteHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var search = await _context.FixedIncomes.FindAsync(f.Id);
        Assert.Null(search);
    }

    [Fact]
    public async Task DeleteFixedIncome_ShouldReturnFalse_WhenDoesNotExist()
    {
        // Arrange
        var command = new DeleteFixedIncomeCommand(999);

        // Act
        var result = await _deleteHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}
