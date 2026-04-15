using API.Infrastructure.Repositories;
using API.Models;
using Microsoft.AspNetCore.Mvc;

namespace API.Features.Transactions;

public static class TransactionEndpoints
{
    public static RouteGroupBuilder MapTransactionEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", async ([FromBody] CreateTransactionDto dto, [FromServices] IRepository<Transaction> repository) =>
        {
            var transaction = new Transaction(dto.Title, dto.Description, dto.Amount, dto.Date, 
                dto.Type, dto.Category, dto.UserId, dto.PaymentMethodId, dto.InstallmentInfo);
            
            await repository.AddAsync(transaction);
            await repository.SaveChangesAsync();
            return Results.Created($"/api/transactions/{transaction.Id}", transaction);
        });

        group.MapGet("/", async ([FromServices] IRepository<Transaction> repository) =>
        {
            return Results.Ok(await repository.GetAllAsync());
        });

        group.MapPut("/{id:int}", async (int id, [FromBody] UpdateTransactionDto dto, [FromServices] IRepository<Transaction> repository) =>
        {
            var transaction = await repository.GetByIdAsync(id);
            if (transaction is null) return Results.NotFound();

            transaction.UpdateDetails(dto.Title, dto.Description, dto.Amount, dto.Category, dto.Date);
            await repository.UpdateAsync(transaction);
            await repository.SaveChangesAsync();
            
            return Results.NoContent();
        });

        group.MapDelete("/{id:int}", async (int id, [FromServices] IRepository<Transaction> repository) =>
        {
            var transaction = await repository.GetByIdAsync(id);
            if (transaction is null) return Results.NotFound();

            await repository.DeleteAsync(transaction);
            await repository.SaveChangesAsync();
            
            return Results.NoContent();
        });

        return group;
    }
}

public record CreateTransactionDto(string Title, string Description, decimal Amount, DateTime Date, 
    TransactionType Type, TransactionCategory Category, int UserId, int PaymentMethodId, string? InstallmentInfo = null);

public record UpdateTransactionDto(string Title, string Description, decimal Amount, TransactionCategory Category, DateTime Date);

