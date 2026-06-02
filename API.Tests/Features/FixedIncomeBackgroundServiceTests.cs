using API.Data;
using API.Features.FixedIncomes;
using API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using System;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace API.Tests.Features;

public class FixedIncomeBackgroundServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<FixedIncomeBackgroundService> _logger;

    public FixedIncomeBackgroundServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        // Setup service provider mocks for CreateScope() extension method
        _serviceProvider = Substitute.For<IServiceProvider>();
        var serviceScopeFactory = Substitute.For<IServiceScopeFactory>();
        var serviceScope = Substitute.For<IServiceScope>();
        var scopeServiceProvider = Substitute.For<IServiceProvider>();

        _serviceProvider.GetService(typeof(IServiceScopeFactory)).Returns(serviceScopeFactory);
        serviceScopeFactory.CreateScope().Returns(serviceScope);
        serviceScope.ServiceProvider.Returns(scopeServiceProvider);
        scopeServiceProvider.GetService(typeof(AppDbContext)).Returns(_context);

        _logger = NullLogger<FixedIncomeBackgroundService>.Instance;
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private async Task InvokeProcessFixedIncomesAsync(FixedIncomeBackgroundService service)
    {
        var method = typeof(FixedIncomeBackgroundService).GetMethod(
            "ProcessFixedIncomes", 
            BindingFlags.NonPublic | BindingFlags.Instance
        );
        
        Assert.NotNull(method);
        
        var task = (Task)method.Invoke(service, new object[] { CancellationToken.None })!;
        await task;
    }

    [Fact]
    public async Task ProcessFixedIncomes_ShouldCreateTransactionAndMarkAsProcessed_WhenDueToday()
    {
        // Arrange
        var today = DateTime.UtcNow;
        var dayOfMonth = today.Day;
        var userId = 1;

        // Seed Category and PaymentMethod
        var category = new Category("Receitas", null, null, userId);
        var paymentMethod = new PaymentMethod("Cash", PaymentMethodType.Cash, userId);
        var fixedIncome = new FixedIncome("Monthly Salary", 5000m, dayOfMonth, userId);

        _context.Categories.Add(category);
        _context.PaymentMethods.Add(paymentMethod);
        _context.FixedIncomes.Add(fixedIncome);
        await _context.SaveChangesAsync();

        var service = new FixedIncomeBackgroundService(_serviceProvider, _logger);

        // Act
        await InvokeProcessFixedIncomesAsync(service);

        // Assert
        var updatedFixedIncome = await _context.FixedIncomes.FindAsync(fixedIncome.Id);
        Assert.NotNull(updatedFixedIncome!.LastProcessedDate);
        Assert.Equal(today.Date, updatedFixedIncome.LastProcessedDate.Value.Date);

        var transactions = await _context.Transactions.Where(t => t.UserId == userId).ToListAsync();
        Assert.Single(transactions);
        var transaction = transactions[0];
        Assert.Equal("Receita Fixa: Monthly Salary", transaction.Title);
        Assert.Equal(5000m, transaction.Amount);
        Assert.Equal(TransactionType.Income, transaction.Type);
        Assert.Equal(category.Id, transaction.CategoryId);
        Assert.Equal(paymentMethod.Id, transaction.PaymentMethodId);
    }

    [Fact]
    public async Task ProcessFixedIncomes_ShouldNotProcess_WhenDueOnDifferentDay()
    {
        // Arrange
        var today = DateTime.UtcNow;
        // Set day of month to a different day
        var differentDay = today.Day == 1 ? 2 : today.Day - 1;
        var userId = 1;

        var category = new Category("Receitas", null, null, userId);
        var paymentMethod = new PaymentMethod("Cash", PaymentMethodType.Cash, userId);
        var fixedIncome = new FixedIncome("Monthly Salary", 5000m, differentDay, userId);

        _context.Categories.Add(category);
        _context.PaymentMethods.Add(paymentMethod);
        _context.FixedIncomes.Add(fixedIncome);
        await _context.SaveChangesAsync();

        var service = new FixedIncomeBackgroundService(_serviceProvider, _logger);

        // Act
        await InvokeProcessFixedIncomesAsync(service);

        // Assert
        var updatedFixedIncome = await _context.FixedIncomes.FindAsync(fixedIncome.Id);
        Assert.Null(updatedFixedIncome!.LastProcessedDate);

        var transactions = await _context.Transactions.ToListAsync();
        Assert.Empty(transactions);
    }

    [Fact]
    public async Task ProcessFixedIncomes_ShouldNotProcess_WhenAlreadyProcessedToday()
    {
        // Arrange
        var today = DateTime.UtcNow;
        var dayOfMonth = today.Day;
        var userId = 1;

        var category = new Category("Receitas", null, null, userId);
        var paymentMethod = new PaymentMethod("Cash", PaymentMethodType.Cash, userId);
        var fixedIncome = new FixedIncome("Monthly Salary", 5000m, dayOfMonth, userId);
        fixedIncome.MarkAsProcessed(today); // Already processed today

        _context.Categories.Add(category);
        _context.PaymentMethods.Add(paymentMethod);
        _context.FixedIncomes.Add(fixedIncome);
        await _context.SaveChangesAsync();

        var service = new FixedIncomeBackgroundService(_serviceProvider, _logger);

        // Act
        await InvokeProcessFixedIncomesAsync(service);

        // Assert
        var transactions = await _context.Transactions.ToListAsync();
        Assert.Empty(transactions);
    }

    [Fact]
    public async Task ProcessFixedIncomes_ShouldFallbackToFirstCategory_WhenReceitasCategoryDoesNotExist()
    {
        // Arrange
        var today = DateTime.UtcNow;
        var dayOfMonth = today.Day;
        var userId = 1;

        // Category doesn't contain "Receita"
        var category = new Category("🍔 Food", null, null, userId);
        var paymentMethod = new PaymentMethod("Cash", PaymentMethodType.Cash, userId);
        var fixedIncome = new FixedIncome("Monthly Salary", 5000m, dayOfMonth, userId);

        _context.Categories.Add(category);
        _context.PaymentMethods.Add(paymentMethod);
        _context.FixedIncomes.Add(fixedIncome);
        await _context.SaveChangesAsync();

        var service = new FixedIncomeBackgroundService(_serviceProvider, _logger);

        // Act
        await InvokeProcessFixedIncomesAsync(service);

        // Assert
        var transactions = await _context.Transactions.ToListAsync();
        Assert.Single(transactions);
        Assert.Equal(category.Id, transactions[0].CategoryId);
    }

    [Fact]
    public async Task ProcessFixedIncomes_ShouldSkip_WhenUserHasNoCategoryOrPaymentMethod()
    {
        // Arrange
        var today = DateTime.UtcNow;
        var dayOfMonth = today.Day;
        var userId = 1;

        // No Category or PaymentMethod seeded
        var fixedIncome = new FixedIncome("Monthly Salary", 5000m, dayOfMonth, userId);
        _context.FixedIncomes.Add(fixedIncome);
        await _context.SaveChangesAsync();

        var service = new FixedIncomeBackgroundService(_serviceProvider, _logger);

        // Act
        await InvokeProcessFixedIncomesAsync(service);

        // Assert
        var transactions = await _context.Transactions.ToListAsync();
        Assert.Empty(transactions);

        var updatedFixedIncome = await _context.FixedIncomes.FindAsync(fixedIncome.Id);
        Assert.Null(updatedFixedIncome!.LastProcessedDate);
    }
}
