using API.Infrastructure.Repositories;
using API.Models;
using Microsoft.EntityFrameworkCore;
using MediatR;

namespace API.Features.Transactions;

public record CreateTransactionCommand(string Title, string Description, decimal Amount, DateTime Date, 
    TransactionType Type, int CategoryId, int UserId, int PaymentMethodId, string? InstallmentInfo = null, int? GoalId = null) : IRequest<Transaction>;
public record GetTransactionsQuery(int UserId) : IRequest<IEnumerable<Transaction>>;
public record UpdateTransactionCommand(int Id, string Title, string Description, decimal Amount, int CategoryId, DateTime Date) : IRequest<bool>;
public record DeleteTransactionCommand(int Id) : IRequest<bool>;

public class PaymentMethodHandlers(IRepository<Transaction> repository, IRepository<Goal> goalRepository, API.Data.AppDbContext dbContext) :
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
        if (request.GoalId.HasValue)
        {
            var goal = await goalRepository.GetByIdAsync(request.GoalId.Value, cancellationToken);
            if (goal != null)
            {
                var beforePercent = goal.TargetAmount > 0 ? (goal.CurrentAmount / goal.TargetAmount) * 100 : 0;
                
                goal.Deposit(request.Amount);
                
                var afterPercent = goal.TargetAmount > 0 ? (goal.CurrentAmount / goal.TargetAmount) * 100 : 0;

                await goalRepository.UpdateAsync(goal);
                await goalRepository.SaveChangesAsync(cancellationToken);

                if (beforePercent < 50 && afterPercent >= 50 && afterPercent < 100)
                {
                    var notification = new Notification("notifications.goalProgressTitle", $"notifications.goalProgressMessage||{goal.Name}", request.UserId);
                    dbContext.Notifications.Add(notification);
                    await dbContext.SaveChangesAsync(cancellationToken);
                }
                else if (beforePercent < 100 && afterPercent >= 100)
                {
                    var notification = new Notification("notifications.goalCompletedTitle", $"notifications.goalCompletedMessage||{goal.Name}", request.UserId);
                    dbContext.Notifications.Add(notification);
                    await dbContext.SaveChangesAsync(cancellationToken);
                }
            }
        }

        // Check Budget Overrun for Expenses
        if (request.Type == TransactionType.Expense)
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            var monthTransactions = await repository.GetAllAsync(cancellationToken);
            var userMonthTransactions = monthTransactions.Where(t => t.UserId == request.UserId && t.Date >= startOfMonth && t.Date < endOfMonth).ToList();

            var totalIncome = userMonthTransactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var totalExpense = userMonthTransactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

            if (totalExpense > totalIncome)
            {
                // Verify if there is already an unread budget alert this month
                var hasUnreadAlert = await dbContext.Notifications
                    .AnyAsync(n => n.UserId == request.UserId && !n.IsRead && n.Title == "notifications.budgetAlertTitle" && n.CreatedAt >= startOfMonth, cancellationToken);
                
                if (!hasUnreadAlert)
                {
                    var notification = new Notification("notifications.budgetAlertTitle", "notifications.budgetAlertMessage", request.UserId);
                    dbContext.Notifications.Add(notification);
                    await dbContext.SaveChangesAsync(cancellationToken);
                }
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

