using MediatR;

namespace API.Features.Users;

public record UpdateProfileDto(string Name, string Email, string Cpf);

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapPut("/{id:int}/update-profile", async (int id, [FromBody] UpdateProfileDto dto, [FromServices] IMediator mediator) => 
        {
            var result = await mediator.Send(new UpdateUserProfileCommand(id, dto.Name, dto.Email, dto.Cpf));
            return result ? Results.NoContent() : Results.NotFound();
        });
        
        group.MapGet("/", async ([FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetAllUsersQuery())));
        
        return group;
    }
}
