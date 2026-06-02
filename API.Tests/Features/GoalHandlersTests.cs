using API.Data;
using API.Features.Goals;
using API.Infrastructure.Repositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace API.Tests.Features;

public class GoalHandlersTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly Repository<Goal> _goalRepo;
    private readonly GoalHandlers _handler;

    public GoalHandlersTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        
        _goalRepo = new Repository<Goal>(_context);
        _handler = new GoalHandlers(_goalRepo, _context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateGoal_ShouldCreateGoalSuccessfully()
    {
        // Arrange
        var command = new CreateGoalCommand("Buy Car", "🚗", "#00FF00", 20000m, 1000m, DateTime.UtcNow.AddMonths(12), 1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Buy Car", result.Name);
        Assert.Equal("🚗", result.Icon);
        Assert.Equal("#00FF00", result.Color);
        Assert.Equal(20000m, result.TargetAmount);
        Assert.Equal(1000m, result.CurrentAmount);
        Assert.Equal(1, result.UserId);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task GetGoals_ShouldReturnOnlyUserGoals_WhenUserIdIsSpecified()
    {
        // Arrange
        var g1 = new Goal("Goal 1", "icon", "color", 1000m, 100m, null, 1);
        var g2 = new Goal("Goal 2", "icon", "color", 2000m, 200m, null, 2);
        await _goalRepo.AddAsync(g1);
        await _goalRepo.AddAsync(g2);
        await _goalRepo.SaveChangesAsync();

        var query = new GetGoalsQuery(UserId: 1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var list = result.ToList();
        Assert.Single(list);
        Assert.Equal("Goal 1", list[0].Name);
    }

    [Fact]
    public async Task GetGoalById_ShouldReturnGoal_WhenExists()
    {
        // Arrange
        var goal = new Goal("Goal 1", "icon", "color", 1000m, 100m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var query = new GetGoalByIdQuery(goal.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(goal.Id, result!.Id);
    }

    [Fact]
    public async Task UpdateGoal_ShouldModifyGoalDetails()
    {
        // Arrange
        var goal = new Goal("Old Goal", "old-icon", "old-color", 1000m, 100m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new UpdateGoalCommand(goal.Id, "New Goal", "new-icon", "new-color", 5000m, DateTime.UtcNow.AddDays(5));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var updated = await _context.Goals.FindAsync(goal.Id);
        Assert.NotNull(updated);
        Assert.Equal("New Goal", updated!.Name);
        Assert.Equal(5000m, updated.TargetAmount);
    }

    [Fact]
    public async Task DepositGoal_ShouldIncreaseCurrentAmount()
    {
        // Arrange
        var goal = new Goal("Save", null, null, 1000m, 100m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new DepositGoalCommand(goal.Id, 200m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(300m, result!.CurrentAmount);
    }

    [Fact]
    public async Task DepositGoal_ShouldCreateNotification_WhenPassing50PercentThreshold()
    {
        // Arrange
        // Target is 1000. Start at 400 (40%). Deposit 150 -> becomes 550 (55%).
        var goal = new Goal("House Fund", null, null, 1000m, 400m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new DepositGoalCommand(goal.Id, 150m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(550m, result!.CurrentAmount);

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == 1);
        Assert.NotNull(notification);
        Assert.Equal("notifications.goalProgressTitle", notification!.Title);
        Assert.Contains("House Fund", notification.Message);
    }

    [Fact]
    public async Task DepositGoal_ShouldCreateNotification_WhenPassing100PercentThreshold()
    {
        // Arrange
        // Target is 1000. Start at 900 (90%). Deposit 150 -> becomes 1050 (105%).
        var goal = new Goal("Vacation", null, null, 1000m, 900m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new DepositGoalCommand(goal.Id, 150m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1050m, result!.CurrentAmount);

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == 1);
        Assert.NotNull(notification);
        Assert.Equal("notifications.goalCompletedTitle", notification!.Title);
        Assert.Contains("Vacation", notification.Message);
    }

    [Fact]
    public async Task WithdrawGoal_ShouldDecreaseCurrentAmount()
    {
        // Arrange
        var goal = new Goal("Save", null, null, 1000m, 500m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new WithdrawGoalCommand(goal.Id, 200m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(300m, result!.CurrentAmount);
    }

    [Fact]
    public async Task WithdrawGoal_ShouldThrowException_WhenAmountExceedsCurrentAmount()
    {
        // Arrange
        var goal = new Goal("Save", null, null, 1000m, 100m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new WithdrawGoalCommand(goal.Id, 200m);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(async () => 
            await _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteGoal_ShouldRemoveGoalSuccessfully()
    {
        // Arrange
        var goal = new Goal("Save", null, null, 1000m, 100m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new DeleteGoalCommand(goal.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var search = await _context.Goals.FindAsync(goal.Id);
        Assert.Null(search);
    }
}
