using MediatR;

namespace API.Features.Users;

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/register", async ([FromBody] RegisterUserCommand command, [FromServices] IMediator mediator) => 
        {
            var user = await mediator.Send(command);
            return Results.Created($"/api/users/{user.Id}", user);
        });

        group.MapPost("/{id:int}/update-profile", async (int id, [FromBody] UpdateProfileDto dto, [FromServices] IMediator mediator) => 
        {
            var result = await mediator.Send(new UpdateUserProfileCommand(id, dto.Name, dto.Email));
            return result ? Results.NoContent() : Results.NotFound();
        });

        // Add login endpoint here

        return group;
    }
}

public record UpdateProfileDto(string Name, string Email);
