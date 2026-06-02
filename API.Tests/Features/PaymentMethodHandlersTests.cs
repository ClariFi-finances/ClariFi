using API.Data;
using API.Features.PaymentMethods;
using API.Infrastructure.Repositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace API.Tests.Features;

public class PaymentMethodHandlersTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly Repository<PaymentMethod> _paymentMethodRepo;
    private readonly PaymentMethodHandlers _handler;

    public PaymentMethodHandlersTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        
        _paymentMethodRepo = new Repository<PaymentMethod>(_context);
        _handler = new PaymentMethodHandlers(_paymentMethodRepo);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task AddPaymentMethod_ShouldCreatePaymentMethod()
    {
        // Arrange
        var command = new AddPaymentMethodCommand("My Credit Card", PaymentMethodType.Credit, 1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("My Credit Card", result.Name);
        Assert.Equal(PaymentMethodType.Credit, result.Type);
        Assert.Equal(1, result.UserId);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task GetPaymentMethods_ShouldReturnOnlyUserPaymentMethods()
    {
        // Arrange
        var pm1 = new PaymentMethod("Cash 1", PaymentMethodType.Cash, 1);
        var pm2 = new PaymentMethod("Cash 2", PaymentMethodType.Cash, 2);
        await _paymentMethodRepo.AddAsync(pm1);
        await _paymentMethodRepo.AddAsync(pm2);
        await _paymentMethodRepo.SaveChangesAsync();

        var query = new GetPaymentMethodsQuery(UserId: 1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var list = result.ToList();
        Assert.Single(list);
        Assert.Equal("Cash 1", list[0].Name);
    }

    [Fact]
    public async Task UpdatePaymentMethodDetails_ShouldModifyDetails_WhenExists()
    {
        // Arrange
        var pm = new PaymentMethod("Old Name", PaymentMethodType.Debit, 1);
        await _paymentMethodRepo.AddAsync(pm);
        await _paymentMethodRepo.SaveChangesAsync();

        var command = new UpdatePaymentMethodDetailsCommand(pm.Id, "New Name", PaymentMethodType.Credit);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var updated = await _context.PaymentMethods.FindAsync(pm.Id);
        Assert.NotNull(updated);
        Assert.Equal("New Name", updated!.Name);
        Assert.Equal(PaymentMethodType.Credit, updated.Type);
    }

    [Fact]
    public async Task UpdatePaymentMethodDetails_ShouldReturnFalse_WhenDoesNotExist()
    {
        // Arrange
        var command = new UpdatePaymentMethodDetailsCommand(999, "New Name", PaymentMethodType.Credit);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task RemovePaymentMethod_ShouldDelete_WhenExists()
    {
        // Arrange
        var pm = new PaymentMethod("To Delete", PaymentMethodType.Cash, 1);
        await _paymentMethodRepo.AddAsync(pm);
        await _paymentMethodRepo.SaveChangesAsync();

        var command = new RemovePaymentMethodCommand(pm.Id);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var search = await _context.PaymentMethods.FindAsync(pm.Id);
        Assert.Null(search);
    }

    [Fact]
    public async Task RemovePaymentMethod_ShouldReturnFalse_WhenDoesNotExist()
    {
        // Arrange
        var command = new RemovePaymentMethodCommand(999);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}
