using API.Data;
using API.Features.Users;
using API.Infrastructure.Repositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace API.Tests.Features;

public class UserHandlersTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly Repository<User> _userRepo;
    private readonly Repository<Category> _categoryRepo;
    private readonly Repository<PaymentMethod> _paymentMethodRepo;
    private readonly UserHandlers _handler;

    public UserHandlersTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        
        _userRepo = new Repository<User>(_context);
        _categoryRepo = new Repository<Category>(_context);
        _paymentMethodRepo = new Repository<PaymentMethod>(_context);
        
        _handler = new UserHandlers(_userRepo, _categoryRepo, _paymentMethodRepo);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task RegisterUser_ShouldCreateUserAndDefaultCategoriesAndPaymentMethods()
    {
        // Arrange
        var command = new RegisterUserCommand("cognito-123", "John Doe", "john@example.com", "12345678901");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("cognito-123", result.CognitoId);
        Assert.Equal("John Doe", result.Name);
        Assert.Equal("john@example.com", result.Email);
        Assert.Equal("12345678901", result.Cpf);
        Assert.True(result.Id > 0);

        // Verify categories
        var categories = await _context.Categories.Where(c => c.UserId == result.Id).ToListAsync();
        Assert.Equal(6, categories.Count);
        Assert.Contains(categories, c => c.Name == "🍔 Food");
        Assert.Contains(categories, c => c.Name == "🏠 Housing");

        // Verify payment methods
        var paymentMethods = await _context.PaymentMethods.Where(p => p.UserId == result.Id).ToListAsync();
        Assert.Equal(3, paymentMethods.Count);
        Assert.Contains(paymentMethods, p => p.Name == "Cash" && p.Type == PaymentMethodType.Cash);
        Assert.Contains(paymentMethods, p => p.Name == "Credit Card" && p.Type == PaymentMethodType.Credit);
    }

    [Fact]
    public async Task LoginUser_ShouldReturnUser_WhenUserExists()
    {
        // Arrange
        var user = new User("cognito-456", "Jane Doe", "jane@example.com", "98765432100");
        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        var query = new LoginUserCommand("cognito-456");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(user.Id, result!.Id);
        Assert.Equal("Jane Doe", result.Name);
    }

    [Fact]
    public async Task LoginUser_ShouldReturnNull_WhenUserDoesNotExist()
    {
        // Arrange
        var query = new LoginUserCommand("non-existent");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateUserProfile_ShouldModifyUserDetails_WhenUserExists()
    {
        // Arrange
        var user = new User("cognito-789", "Old Name", "old@example.com", "11111111111");
        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        var command = new UpdateUserProfileCommand(user.Id, "cognito-new", "New Name", "new@example.com", "22222222222");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var updatedUser = await _context.Users.FindAsync(user.Id);
        Assert.NotNull(updatedUser);
        Assert.Equal("cognito-new", updatedUser!.CognitoId);
        Assert.Equal("New Name", updatedUser.Name);
        Assert.Equal("new@example.com", updatedUser.Email);
        Assert.Equal("22222222222", updatedUser.Cpf);
    }

    [Fact]
    public async Task UpdateUserProfile_ShouldReturnFalse_WhenUserDoesNotExist()
    {
        // Arrange
        var command = new UpdateUserProfileCommand(999, "cognito-none", "No Name", "no@example.com", "00000000000");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetAllUsers_ShouldReturnAllRegisteredUsers()
    {
        // Arrange
        var user1 = new User("c1", "User 1", "u1@example.com", "1");
        var user2 = new User("c2", "User 2", "u2@example.com", "2");
        await _userRepo.AddAsync(user1);
        await _userRepo.AddAsync(user2);
        await _userRepo.SaveChangesAsync();

        var query = new GetAllUsersQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count());
    }
}
