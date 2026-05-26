using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Features.FixedIncomes;

public record CreateFixedIncomeDto(string Name, decimal Amount, int DayOfMonth, int UserId);
public record UpdateFixedIncomeDto(string Name, decimal Amount, int DayOfMonth);

public static class FixedIncomeEndpoints
{
    public static RouteGroupBuilder MapFixedIncomeEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", async ([FromQuery] int userId, [FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetUserFixedIncomesQuery(userId))));

        group.MapPost("/add", async ([FromBody] CreateFixedIncomeDto dto, [FromServices] IMediator mediator) =>
        {
            var result = await mediator.Send(new CreateFixedIncomeCommand(dto.Name, dto.Amount, dto.DayOfMonth, dto.UserId));
            return Results.Created($"/api/fixed-incomes/{result.Id}", result);
        });

        group.MapPut("/{id:int}/update", async (int id, [FromBody] UpdateFixedIncomeDto dto, [FromServices] IMediator mediator) =>
        {
            var result = await mediator.Send(new UpdateFixedIncomeCommand(id, dto.Name, dto.Amount, dto.DayOfMonth));
            return result ? Results.NoContent() : Results.NotFound();
        });

        group.MapDelete("/{id:int}/remove", async (int id, [FromServices] IMediator mediator) =>
        {
            var result = await mediator.Send(new DeleteFixedIncomeCommand(id));
            return result ? Results.NoContent() : Results.NotFound();
        });

        return group;
    }
}
