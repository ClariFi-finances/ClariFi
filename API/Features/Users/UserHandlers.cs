using API.Infrastructure.Repositories;
using API.Models;
using MediatR;

namespace API.Features.Users;

public record RegisterUserCommand(string Name, string Email, string Password, string Cpf) : IRequest<User>;
public record UpdateUserProfileCommand(int Id, string Name, string Email) : IRequest<bool>;

public class UserHandlers :
    IRequestHandler<RegisterUserCommand, User>,
    IRequestHandler<UpdateUserProfileCommand, bool>
{
    private readonly IRepository<User> _repository;

    public UserHandlers(IRepository<User> repository)
    {
        _repository = repository;
    }

    public async Task<User> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User(request.Name, request.Email, request.Password, request.Cpf);
        await _repository.AddAsync(user);
        await _repository.SaveChangesAsync();
        return user;
    }

    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _repository.GetByIdAsync(request.Id);
        if (user is null) return false;

        user.UpdateProfile(request.Name, request.Email);
        await _repository.UpdateAsync(user);
        await _repository.SaveChangesAsync();
        return true;
    }
}

