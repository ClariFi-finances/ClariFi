using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.Transactions;

public record CreateTransactionCommand(string Title, string Description, decimal Amount, DateTime Date, 
    TransactionType Type, TransactionCategory Category, int UserId, int PaymentMethodId, string? InstallmentInfo = null) : IRequest<Transaction>;
public record GetTransactionsQuery() : IRequest<IEnumerable<Transaction>>;
public record UpdateTransactionCommand(int Id, string Title, string Description, decimal Amount, TransactionCategory Category, DateTime Date) : IRequest<bool>;
public record DeleteTransactionCommand(int Id) : IRequest<bool>;

public class PaymentMethodHandlers(IRepository<Transaction> repository) :
    IRequestHandler<CreateTransactionCommand, Transaction>,
    IRequestHandler<GetTransactionsQuery, IEnumerable<Transaction>>,
    IRequestHandler<UpdateTransactionCommand, bool>,
    IRequestHandler<DeleteTransactionCommand, bool>
{

    public async Task<Transaction> Handle(CreateTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = new Transaction(
            request.Title, request.Description, request.Amount, request.Date, 
            request.Type, request.Category, request.UserId, request.PaymentMethodId, request.InstallmentInfo);
        
        await repository.AddAsync(transaction, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return transaction;
    }

    public async Task<IEnumerable<Transaction>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        return await repository.GetAllAsync(cancellationToken);
    }

    public async Task<bool> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } transaction) return false;

        transaction.UpdateDetails(request.Title, request.Description, request.Amount, request.Category, request.Date);
        await repository.UpdateAsync(transaction);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(DeleteTransactionCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } transaction) return false;
        
        await repository.DeleteAsync(transaction);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

