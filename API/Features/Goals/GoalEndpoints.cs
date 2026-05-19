using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Features.Goals;

public record UpdateGoalDto(string Name, string? Icon, string? Color, decimal TargetAmount, DateTime? Deadline);
public record GoalTransactionDto(decimal Amount);

public static class GoalEndpoints
{
    public static RouteGroupBuilder MapGoalEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/add", async ([FromBody] CreateGoalCommand command, [FromServices] IMediator mediator) =>
        {
            var goal = await mediator.Send(command);
            return Results.Created($"/api/goals/{goal.Id}", goal);
        });

        group.MapGet("/", async ([FromQuery] int? userId, [FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetGoalsQuery(userId))));

        group.MapGet("/{id:int}", async (int id, [FromServices] IMediator mediator) =>
        {
            var goal = await mediator.Send(new GetGoalByIdQuery(id));
            return goal is not null ? Results.Ok(goal) : Results.NotFound();
        });

        group.MapPut("/{id:int}/update", async (int id, [FromBody] UpdateGoalDto dto, [FromServices] IMediator mediator) =>
            await mediator.Send(new UpdateGoalCommand(id, dto.Name, dto.Icon, dto.Color, dto.TargetAmount, dto.Deadline))
                ? Results.NoContent()
                : Results.NotFound());

        group.MapPost("/{id:int}/deposit", async (int id, [FromBody] GoalTransactionDto dto, [FromServices] IMediator mediator) =>
        {
            try
            {
                var goal = await mediator.Send(new DepositGoalCommand(id, dto.Amount));
                return goal is not null ? Results.Ok(goal) : Results.NotFound();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        group.MapPost("/{id:int}/withdraw", async (int id, [FromBody] GoalTransactionDto dto, [FromServices] IMediator mediator) =>
        {
            try
            {
                var goal = await mediator.Send(new WithdrawGoalCommand(id, dto.Amount));
                return goal is not null ? Results.Ok(goal) : Results.NotFound();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        group.MapDelete("/{id:int}/remove", async (int id, [FromServices] IMediator mediator) =>
            await mediator.Send(new DeleteGoalCommand(id))
                ? Results.NoContent()
                : Results.NotFound());

        return group;
    }
}
