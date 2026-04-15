using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.Users;

public record RegisterUserCommand(string Name, string Email, string Password, string Cpf) : IRequest<User>;
public record UpdateUserProfileCommand(int Id, string Name, string Email) : IRequest<bool>;

public class UserHandlers(IRepository<User> repository) :
    IRequestHandler<RegisterUserCommand, User>,
    IRequestHandler<UpdateUserProfileCommand, bool>
{

    public async Task<User> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User(request.Name, request.Email, request.Password, request.Cpf);
        await repository.AddAsync(user);
        await repository.SaveChangesAsync();
        return user;
    }

    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id) is not { } user) return false;

        user.UpdateProfile(request.Name, request.Email);
        await repository.UpdateAsync(user);
        await repository.SaveChangesAsync();
        return true;
    }
}

