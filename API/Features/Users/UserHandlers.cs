using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.Users;

public record UpdateUserProfileCommand(int Id, string Name, string Email, string Cpf) : IRequest<bool>;
public record GetAllUsersQuery() : IRequest<IEnumerable<User>>;

public class UserHandlers(IRepository<User> repository) :
    IRequestHandler<UpdateUserProfileCommand, bool>,
    IRequestHandler<GetAllUsersQuery, IEnumerable<User>>
{

    public async Task<IEnumerable<User>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
        => await repository.GetAllAsync(cancellationToken);

    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } user) return false;

        user.UpdateProfile(request.Name, request.Email, request.Cpf);
        await repository.UpdateAsync(user);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
    
}
