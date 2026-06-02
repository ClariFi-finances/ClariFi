using API.Data;
using API.Infrastructure.Repositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using TransactionHandlersClass = API.Features.Transactions.PaymentMethodHandlers;
using API.Features.Transactions;

namespace API.Tests.Features;

public class TransactionHandlersTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly Repository<Transaction> _transactionRepo;
    private readonly Repository<Goal> _goalRepo;
    private readonly TransactionHandlersClass _handler;

    public TransactionHandlersTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _transactionRepo = new Repository<Transaction>(_context);
        _goalRepo = new Repository<Goal>(_context);
        _handler = new TransactionHandlersClass(_transactionRepo, _goalRepo, _context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateTransaction_ShouldCreateTransactionSuccessfully()
    {
        // Arrange
        var command = new CreateTransactionCommand(
            Title: "Coffee",
            Description: "Starbucks",
            Amount: 5.50m,
            Date: DateTime.UtcNow,
            Type: TransactionType.Expense,
            CategoryId: 1,
            UserId: 1,
            PaymentMethodId: 2
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Coffee", result.Title);
        Assert.Equal(5.50m, result.Amount);
        Assert.Equal(TransactionType.Expense, result.Type);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task CreateTransaction_ShouldAutoDepositToGoal_WhenGoalIdIsProvided()
    {
        // Arrange
        var goal = new Goal("Car Fund", null, null, 1000m, 100m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new CreateTransactionCommand(
            Title: "Monthly Save",
            Description: "Saving",
            Amount: 200m,
            Date: DateTime.UtcNow,
            Type: TransactionType.Income,
            CategoryId: 1,
            UserId: 1,
            PaymentMethodId: 2,
            GoalId: goal.Id
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var updatedGoal = await _context.Goals.FindAsync(goal.Id);
        Assert.NotNull(updatedGoal);
        Assert.Equal(300m, updatedGoal!.CurrentAmount); // 100 + 200
    }

    [Fact]
    public async Task CreateTransaction_ShouldTriggerGoalCompletedNotification_WhenGoalReaches100Percent()
    {
        // Arrange
        var goal = new Goal("Phone", null, null, 500m, 450m, null, 1);
        await _goalRepo.AddAsync(goal);
        await _goalRepo.SaveChangesAsync();

        var command = new CreateTransactionCommand(
            Title: "Final Save",
            Description: "Save",
            Amount: 100m,
            Date: DateTime.UtcNow,
            Type: TransactionType.Income,
            CategoryId: 1,
            UserId: 1,
            PaymentMethodId: 2,
            GoalId: goal.Id
        );

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == 1);
        Assert.NotNull(notification);
        Assert.Equal("notifications.goalCompletedTitle", notification!.Title);
    }

    [Fact]
    public async Task CreateTransaction_ShouldTriggerBudgetOverrunAlert_WhenExpensesExceedIncome()
    {
        // Arrange
        // Add an income transaction first
        var income = new Transaction("Salary", "Monthly salary", 1000m, DateTime.UtcNow, TransactionType.Income, 1, 1, 1);
        await _transactionRepo.AddAsync(income);
        await _transactionRepo.SaveChangesAsync();

        // Create an expense that exceeds the income ($1200 > $1000)
        var command = new CreateTransactionCommand(
            Title: "Rent",
            Description: "Apartment",
            Amount: 1200m,
            Date: DateTime.UtcNow,
            Type: TransactionType.Expense,
            CategoryId: 1,
            UserId: 1,
            PaymentMethodId: 2
        );

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var alert = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == 1 && n.Title == "notifications.budgetAlertTitle");
        Assert.NotNull(alert);
        Assert.Equal("notifications.budgetAlertMessage", alert!.Message);
    }

    [Fact]
    public async Task CreateTransaction_ShouldNotCreateDuplicateBudgetOverrunAlert_WhenOneAlreadyExists()
    {
        // Arrange
        // Pre-create an unread budget alert for this month
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var existingAlert = new Notification("notifications.budgetAlertTitle", "notifications.budgetAlertMessage", 1);
        _context.Notifications.Add(existingAlert);
        
        // Add income and expense
        var income = new Transaction("Salary", "Monthly salary", 1000m, DateTime.UtcNow, TransactionType.Income, 1, 1, 1);
        var expense = new Transaction("Rent", "Apartment", 1200m, DateTime.UtcNow, TransactionType.Expense, 1, 1, 1);
        await _transactionRepo.AddAsync(income);
        await _transactionRepo.AddAsync(expense);
        await _transactionRepo.SaveChangesAsync();

        var command = new CreateTransactionCommand(
            Title: "Groceries",
            Description: "Food",
            Amount: 100m,
            Date: DateTime.UtcNow,
            Type: TransactionType.Expense,
            CategoryId: 1,
            UserId: 1,
            PaymentMethodId: 2
        );

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var alertCount = await _context.Notifications.CountAsync(n => n.UserId == 1 && n.Title == "notifications.budgetAlertTitle");
        Assert.Equal(1, alertCount); // Only the original pre-existing alert should exist
    }

    [Fact]
    public async Task GetTransactions_ShouldReturnUserTransactionsOnly()
    {
        // Arrange
        var t1 = new Transaction("User1 Tx", "", 10m, DateTime.UtcNow, TransactionType.Expense, 1, 1, 1);
        var t2 = new Transaction("User2 Tx", "", 20m, DateTime.UtcNow, TransactionType.Expense, 1, 2, 1);
        await _transactionRepo.AddAsync(t1);
        await _transactionRepo.AddAsync(t2);
        await _transactionRepo.SaveChangesAsync();

        var query = new GetTransactionsQuery(1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var list = result.ToList();
        Assert.Single(list);
        Assert.Equal("User1 Tx", list[0].Title);
    }

    [Fact]
    public async Task UpdateTransaction_ShouldModifyDetails()
    {
        // Arrange
        var tx = new Transaction("Old Title", "Old Desc", 50m, DateTime.UtcNow, TransactionType.Expense, 1, 1, 1);
        await _transactionRepo.AddAsync(tx);
        await _transactionRepo.SaveChangesAsync();

        var command = new UpdateTransactionCommand(tx.Id, "New Title", "New Desc", 75m, 2, DateTime.UtcNow.AddDays(1));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var updated = await _context.Transactions.FindAsync(tx.Id);
        Assert.NotNull(updated);
        Assert.Equal("New Title", updated!.Title);
        Assert.Equal("New Desc", updated.Description);
        Assert.Equal(75m, updated.Amount);
        Assert.Equal(2, updated.CategoryId);
    }

    [Fact]
    public async Task DeleteTransaction_ShouldRemoveSuccessfully()
    {
        // Arrange
        var tx = new Transaction("To Delete", "", 50m, DateTime.UtcNow, TransactionType.Expense, 1, 1, 1);
        await _transactionRepo.AddAsync(tx);
        await _transactionRepo.SaveChangesAsync();

        var command = new DeleteTransactionCommand(tx.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var search = await _context.Transactions.FindAsync(tx.Id);
        Assert.Null(search);
    }
}
