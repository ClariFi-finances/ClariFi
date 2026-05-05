using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Features.Categories;

public record UpdateCategoryDto(string Name, string? Icon, string? Color);

public static class CategoryEndpoints
{
    public static RouteGroupBuilder MapCategoryEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/add", async ([FromBody] AddCategoryCommand command, [FromServices] IMediator mediator) =>
        {
            var category = await mediator.Send(command);
            return Results.Created($"/api/categories/{category.Id}", category);
        });

        group.MapGet("/", async ([FromQuery] int? userId, [FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetCategoriesQuery(userId))));

        group.MapPut("/{id:int}/update", async (int id, [FromBody] UpdateCategoryDto dto, [FromServices] IMediator mediator) =>
            await mediator.Send(new UpdateCategoryCommand(id, dto.Name, dto.Icon, dto.Color)) 
                ? Results.NoContent()
                : Results.NotFound());

        group.MapDelete("/{id:int}/remove", async (int id, [FromServices] IMediator mediator) =>
            await mediator.Send(new RemoveCategoryCommand(id))
                ? Results.NoContent()
                : Results.NotFound());

        return group;
    }
}
