using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.Users;

public record RegisterUserCommand(string CognitoId) : IRequest<User>;
public record LoginUserCommand(string CognitoId) : IRequest<User?>;
public record UpdateUserProfileCommand(int Id, string CognitoId) : IRequest<bool>;
public record GetAllUsersQuery() : IRequest<IEnumerable<User>>;

public class UserHandlers(IRepository<User> repository) :
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
        return user;
    }
    
    public async Task<User?> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var users = await repository.GetAllAsync(cancellationToken);

        return users.FirstOrDefault(user =>
            user.CognitoId == request.CognitoId);
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
