using MediatR;

namespace API.Features.Transactions;

public record CreateTransactionDto(string Title, string Description, decimal Amount, DateTime Date, 
    TransactionType Type, TransactionCategory Category, int UserId, int PaymentMethodId, string? InstallmentInfo = null);

public record UpdateTransactionDto(string Title, string Description, decimal Amount, TransactionCategory Category, DateTime Date);

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
        {
            return Results.Ok(await mediator.Send(new GetTransactionsQuery()));
        });

        group.MapPut("/{id:int}/adjust", async (int id, [FromBody] UpdateTransactionDto dto, [FromServices] IMediator mediator) =>
        {
            var command = new UpdateTransactionCommand(id, dto.Title, dto.Description, dto.Amount, dto.Category, dto.Date);
            var result = await mediator.Send(command);
            return result ? Results.NoContent() : Results.NotFound();
        });

        group.MapDelete("/{id:int}", async (int id, [FromServices] IMediator mediator) =>
        {
            var result = await mediator.Send(new DeleteTransactionCommand(id));
            return result ? Results.NoContent() : Results.NotFound();
        });

        return group;
    }
}

