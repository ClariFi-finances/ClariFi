using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.Users;

public record RegisterUserCommand(string Name, string Email, string Password, string Cpf) : IRequest<User>;
public record UpdateUserProfileCommand(int Id, string Name, string Email, string Cpf) : IRequest<bool>;
public record GetAllUsersQuery() : IRequest<IEnumerable<User>>;

public class UserHandlers(IRepository<User> repository) :
    IRequestHandler<RegisterUserCommand, User>,
    IRequestHandler<UpdateUserProfileCommand, bool>,
    IRequestHandler<GetAllUsersQuery, IEnumerable<User>>
{

    public async Task<IEnumerable<User>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
        => await repository.GetAllAsync(cancellationToken);

    public async Task<User> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User(request.Name, request.Email, request.Password, request.Cpf);
        await repository.AddAsync(user, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } user) return false;

        user.UpdateProfile(request.Name, request.Email, request.Cpf);
        await repository.UpdateAsync(user);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
    
}
