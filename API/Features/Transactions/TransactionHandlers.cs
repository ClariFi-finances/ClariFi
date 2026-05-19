using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.Transactions;

public record CreateTransactionCommand(string Title, string Description, decimal Amount, DateTime Date, 
    TransactionType Type, int CategoryId, int UserId, int PaymentMethodId, string? InstallmentInfo = null, int? GoalId = null) : IRequest<Transaction>;
public record GetTransactionsQuery(int UserId) : IRequest<IEnumerable<Transaction>>;
public record UpdateTransactionCommand(int Id, string Title, string Description, decimal Amount, int CategoryId, DateTime Date) : IRequest<bool>;
public record DeleteTransactionCommand(int Id) : IRequest<bool>;

public class PaymentMethodHandlers(IRepository<Transaction> repository, IRepository<Goal> goalRepository) :
    IRequestHandler<CreateTransactionCommand, Transaction>,
    IRequestHandler<GetTransactionsQuery, IEnumerable<Transaction>>,
    IRequestHandler<UpdateTransactionCommand, bool>,
    IRequestHandler<DeleteTransactionCommand, bool>
{

    public async Task<Transaction> Handle(CreateTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = new Transaction(
            request.Title, request.Description, request.Amount, request.Date, 
            request.Type, request.CategoryId, request.UserId, request.PaymentMethodId, request.InstallmentInfo, request.GoalId);
        
        await repository.AddAsync(transaction, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);

        // Auto-deposit to goal if linked
        if (request.GoalId.HasValue && request.Type == TransactionType.Income)
        {
            var goal = await goalRepository.GetByIdAsync(request.GoalId.Value, cancellationToken);
            if (goal != null)
            {
                goal.Deposit(request.Amount);
                await goalRepository.UpdateAsync(goal);
                await goalRepository.SaveChangesAsync(cancellationToken);
            }
        }

        return transaction;
    }

    public async Task<IEnumerable<Transaction>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var transactions = await repository.GetAllAsync(cancellationToken);
        return transactions.Where(t => t.UserId == request.UserId);
    }

    public async Task<bool> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } transaction) return false;

        transaction.UpdateDetails(request.Title, request.Description, request.Amount, request.CategoryId, request.Date);
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

