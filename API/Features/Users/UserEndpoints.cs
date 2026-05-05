using MediatR;

namespace API.Features.Users;

public record UpdateProfileDto(string CognitoId);
public record LoginDto(string CognitoId);
public record UserLoginResponseDto(int Id, string CognitoId);

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
                : Results.Ok(new UserLoginResponseDto(user.Id, user.CognitoId));
        });

        group.MapPut("/{id:int}/update-profile", async (int id, [FromBody] UpdateProfileDto dto, [FromServices] IMediator mediator) => 
        {
            var result = await mediator.Send(new UpdateUserProfileCommand(id, dto.CognitoId));
            return result ? Results.NoContent() : Results.NotFound();
        });
        
        group.MapGet("/", async ([FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetAllUsersQuery())));
        
        return group;
    }
}
