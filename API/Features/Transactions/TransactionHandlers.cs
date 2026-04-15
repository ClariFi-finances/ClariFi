using API.Infrastructure.Repositories;
using API.Models;
using MediatR;

namespace API.Features.Transactions;

public record CreateTransactionCommand(string Title, string Description, decimal Amount, DateTime Date, 
    TransactionType Type, TransactionCategory Category, int UserId, int PaymentMethodId, string? InstallmentInfo = null) : IRequest<Transaction>;
public record GetTransactionsQuery() : IRequest<IEnumerable<Transaction>>;
public record UpdateTransactionCommand(int Id, string Title, string Description, decimal Amount, TransactionCategory Category, DateTime Date) : IRequest<bool>;
public record DeleteTransactionCommand(int Id) : IRequest<bool>;

public class TransactionHandlers : 
    IRequestHandler<CreateTransactionCommand, Transaction>,
    IRequestHandler<GetTransactionsQuery, IEnumerable<Transaction>>,
    IRequestHandler<UpdateTransactionCommand, bool>,
    IRequestHandler<DeleteTransactionCommand, bool>
{
    private readonly IRepository<Transaction> _repository;

    public TransactionHandlers(IRepository<Transaction> repository)
    {
        _repository = repository;
    }

    public async Task<Transaction> Handle(CreateTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = new Transaction(
            request.Title, request.Description, request.Amount, request.Date, 
            request.Type, request.Category, request.UserId, request.PaymentMethodId, request.InstallmentInfo);
        
        await _repository.AddAsync(transaction);
        await _repository.SaveChangesAsync();
        return transaction;
    }

    public async Task<IEnumerable<Transaction>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetAllAsync();
    }

    public async Task<bool> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await _repository.GetByIdAsync(request.Id);
        if (transaction is null) return false;

        transaction.UpdateDetails(request.Title, request.Description, request.Amount, request.Category, request.Date);
        await _repository.UpdateAsync(transaction);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> Handle(DeleteTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await _repository.GetByIdAsync(request.Id);
        if (transaction is null) return false;

        await _repository.DeleteAsync(transaction);
        await _repository.SaveChangesAsync();
        return true;
    }
}

