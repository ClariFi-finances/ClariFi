using API.Infrastructure.Repositories;

namespace API.Features.Users;

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/register", async ([FromBody] RegisterUserDto dto, [FromServices] IRepository<User> repository) => 
        {
            var user = new User(dto.Name, dto.Email, dto.Password, dto.CPF);
            await repository.AddAsync(user);
            await repository.SaveChangesAsync();
            return Results.Created($"/api/users/{user.Id}", user);
        });

        group.MapPost("/{id:int}/update-profile", async (int id, [FromBody] UpdateProfileDto dto, [FromServices] IRepository<User> repository) => 
        {
            var user = await repository.GetByIdAsync(id);
            if (user is null) return Results.NotFound();

            user.UpdateProfile(dto.Name, dto.Email);
            await repository.UpdateAsync(user);
            await repository.SaveChangesAsync();
            
            return Results.NoContent();
        });

        // Add login endpoint here

        return group;
    }
}

public record RegisterUserDto(string Name, string Email, string Password, string CPF);
public record UpdateProfileDto(string Name, string Email);
