using MediatR;

namespace API.Features.Transactions;

public record UpdateTransactionDto(string Title, string Description, decimal Amount, int CategoryId, DateTime Date);

public static class TransactionEndpoints
{
    public static RouteGroupBuilder MapTransactionEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/log", async ([FromBody] CreateTransactionCommand command, [FromServices] IMediator mediator) =>
        {
            var transaction = await mediator.Send(command);
            return Results.Created($"/api/transactions/{transaction.Id}", transaction);
        });

        group.MapGet("/", async ([FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetTransactionsQuery())));

        group.MapPut("/{id:int}/adjust", async (int id, [FromBody] UpdateTransactionDto dto, [FromServices] IMediator mediator) =>
             await mediator.Send(new UpdateTransactionCommand(id, dto.Title, dto.Description, dto.Amount, dto.CategoryId, dto.Date))
                 ? Results.NoContent() 
                 : Results.NotFound());
        
        group.MapDelete("/{id:int}", async (int id, [FromServices] IMediator mediator) =>
        await mediator.Send(new DeleteTransactionCommand(id)) 
            ? Results.NoContent() 
            : Results.NotFound());

        return group;
    }
}

