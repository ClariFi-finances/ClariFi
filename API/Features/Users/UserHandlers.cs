using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.Users;

public record RegisterUserCommand(string CognitoId) : IRequest<User>;
public record LoginUserCommand(string CognitoId) : IRequest<User?>;
public record UpdateUserProfileCommand(int Id, string CognitoId) : IRequest<bool>;
public record GetAllUsersQuery() : IRequest<IEnumerable<User>>;

public class UserHandlers(
    IRepository<User> repository,
    IRepository<Category> categoryRepository,
    IRepository<PaymentMethod> paymentMethodRepository) :
    IRequestHandler<RegisterUserCommand, User>,
    IRequestHandler<LoginUserCommand, User?>,
    IRequestHandler<UpdateUserProfileCommand, bool>,
    IRequestHandler<GetAllUsersQuery, IEnumerable<User>>
{

    public async Task<IEnumerable<User>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
        => await repository.GetAllAsync(cancellationToken);

    public async Task<User> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User(request.CognitoId);
        await repository.AddAsync(user, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        var defaultCategories = new[]
        {
            new Category("Food", null, null, user.Id),
            new Category("Housing", null, null, user.Id),
            new Category("Transport", null, null, user.Id),
            new Category("Health", null, null, user.Id),
            new Category("Leisure", null, null, user.Id),
            new Category("Bills", null, null, user.Id),
        };

        foreach (var category in defaultCategories)
        {
            await categoryRepository.AddAsync(category, cancellationToken);
        }

        var defaultPaymentMethods = new[]
        {
            new PaymentMethod("Cash", PaymentMethodType.Cash, user.Id),
            new PaymentMethod("Credit Card", PaymentMethodType.Credit, user.Id),
            new PaymentMethod("Debit Card", PaymentMethodType.Debit, user.Id),
        };

        foreach (var paymentMethod in defaultPaymentMethods)
        {
            await paymentMethodRepository.AddAsync(paymentMethod, cancellationToken);
        }

        await repository.SaveChangesAsync(cancellationToken);
        return user;
    }
    
    public async Task<User?> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var users = await repository.GetAllAsync(cancellationToken);

        var user = users.FirstOrDefault(u => u.CognitoId == request.CognitoId);
        
        if (user != null)
        {
            var categories = await categoryRepository.GetAllAsync(cancellationToken);
            if (!categories.Any(c => c.UserId == user.Id))
            {
                var defaultCategories = new[]
                {
                    new Category("Food", null, null, user.Id),
                    new Category("Housing", null, null, user.Id),
                    new Category("Transport", null, null, user.Id),
                    new Category("Health", null, null, user.Id),
                    new Category("Leisure", null, null, user.Id),
                    new Category("Bills", null, null, user.Id),
                };
                foreach (var category in defaultCategories)
                {
                    await categoryRepository.AddAsync(category, cancellationToken);
                }
                await repository.SaveChangesAsync(cancellationToken);
            }

            var paymentMethods = await paymentMethodRepository.GetAllAsync(cancellationToken);
            if (!paymentMethods.Any(p => p.UserId == user.Id))
            {
                var defaultPaymentMethods = new[]
                {
                    new PaymentMethod("Cash", PaymentMethodType.Cash, user.Id),
                    new PaymentMethod("Credit Card", PaymentMethodType.Credit, user.Id),
                    new PaymentMethod("Debit Card", PaymentMethodType.Debit, user.Id),
                };
                foreach (var paymentMethod in defaultPaymentMethods)
                {
                    await paymentMethodRepository.AddAsync(paymentMethod, cancellationToken);
                }
                await repository.SaveChangesAsync(cancellationToken);
            }
        }

        return user;
    }
    
    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } user) return false;

        user.UpdateCognitoId(request.CognitoId);
        await repository.UpdateAsync(user);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
    
}
