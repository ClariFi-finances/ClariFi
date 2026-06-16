using MediatR;

namespace API.Features.Users;

public record UpdateProfileDto(string CognitoId, string Name, string Email, string Cpf);
public record LoginDto(string CognitoId);
public record UserLoginResponseDto(int Id, string CognitoId, string Name, string Email, string Cpf, bool IsAdmin);

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/register", async ([FromBody] RegisterUserCommand command, [FromServices] IMediator mediator) => 
        {
            var user = await mediator.Send(command);
            return Results.Created($"/api/users/{user.Id}", user);
        });
        
        group.MapPost("/login", async ([FromBody] LoginDto dto, [FromServices] IMediator mediator) =>
        {
            var user = await mediator.Send(new LoginUserCommand(dto.CognitoId));
            return user is null
                ? Results.Unauthorized()
                : Results.Ok(new UserLoginResponseDto(user.Id, user.CognitoId, user.Name, user.Email, user.Cpf, user.IsAdmin));
        });

        group.MapPut("/{id:int}/update-profile", async (int id, [FromBody] UpdateProfileDto dto, [FromServices] IMediator mediator) => 
        {
            var result = await mediator.Send(new UpdateUserProfileCommand(id, dto.CognitoId, dto.Name, dto.Email, dto.Cpf));
            return result ? Results.NoContent() : Results.NotFound();
        });
        
        group.MapGet("/", async ([FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetAllUsersQuery())));
        
        return group;
    }
}
