using API.Infrastructure.Repositories;
using API.Models;
using MediatR;

namespace API.Features.Goals;

// ---- Commands & Queries ----
public record CreateGoalCommand(string Name, string? Icon, string? Color, decimal TargetAmount, decimal CurrentAmount, DateTime? Deadline, int UserId) : IRequest<Goal>;
public record GetGoalsQuery(int? UserId = null) : IRequest<IEnumerable<Goal>>;
public record GetGoalByIdQuery(int Id) : IRequest<Goal?>;
public record UpdateGoalCommand(int Id, string Name, string? Icon, string? Color, decimal TargetAmount, DateTime? Deadline) : IRequest<bool>;
public record DepositGoalCommand(int Id, decimal Amount) : IRequest<Goal?>;
public record WithdrawGoalCommand(int Id, decimal Amount) : IRequest<Goal?>;
public record DeleteGoalCommand(int Id) : IRequest<bool>;

// ---- Handlers ----
public class GoalHandlers(IRepository<Goal> repository, API.Data.AppDbContext dbContext) :
    IRequestHandler<CreateGoalCommand, Goal>,
    IRequestHandler<GetGoalsQuery, IEnumerable<Goal>>,
    IRequestHandler<GetGoalByIdQuery, Goal?>,
    IRequestHandler<UpdateGoalCommand, bool>,
    IRequestHandler<DepositGoalCommand, Goal?>,
    IRequestHandler<WithdrawGoalCommand, Goal?>,
    IRequestHandler<DeleteGoalCommand, bool>
{
    public async Task<Goal> Handle(CreateGoalCommand request, CancellationToken cancellationToken)
    {
        var goal = new Goal(request.Name, request.Icon, request.Color, request.TargetAmount, request.CurrentAmount, request.Deadline, request.UserId);
        await repository.AddAsync(goal, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return goal;
    }

    public async Task<IEnumerable<Goal>> Handle(GetGoalsQuery request, CancellationToken cancellationToken)
    {
        var goals = await repository.GetAllAsync(cancellationToken);
        if (request.UserId.HasValue)
        {
            goals = goals.Where(g => g.UserId == request.UserId.Value);
        }
        return goals;
    }

    public async Task<Goal?> Handle(GetGoalByIdQuery request, CancellationToken cancellationToken)
    {
        return await repository.GetByIdAsync(request.Id, cancellationToken);
    }

    public async Task<bool> Handle(UpdateGoalCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } goal) return false;
        goal.UpdateDetails(request.Name, request.Icon, request.Color, request.TargetAmount, request.Deadline);
        await repository.UpdateAsync(goal);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<Goal?> Handle(DepositGoalCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } goal) return null;
        
        var beforePercent = goal.TargetAmount > 0 ? (goal.CurrentAmount / goal.TargetAmount) * 100 : 0;
        
        goal.Deposit(request.Amount);
        
        var afterPercent = goal.TargetAmount > 0 ? (goal.CurrentAmount / goal.TargetAmount) * 100 : 0;
        
        await repository.UpdateAsync(goal);
        await repository.SaveChangesAsync(cancellationToken);
                if (beforePercent < 50 && afterPercent >= 50 && afterPercent < 100)
            {
                var notification = new Notification("notifications.goalProgressTitle", $"notifications.goalProgressMessage||{goal.Name}", goal.UserId);
                dbContext.Notifications.Add(notification);
            }
            else if (beforePercent < 100 && afterPercent >= 100)
            {
                var notification = new Notification("notifications.goalCompletedTitle", $"notifications.goalCompletedMessage||{goal.Name}", goal.UserId);
                dbContext.Notifications.Add(notification);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        
        return goal;
    }

    public async Task<Goal?> Handle(WithdrawGoalCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } goal) return null;
        goal.Withdraw(request.Amount);
        await repository.UpdateAsync(goal);
        await repository.SaveChangesAsync(cancellationToken);
        return goal;
    }

    public async Task<bool> Handle(DeleteGoalCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } goal) return false;
        await repository.DeleteAsync(goal);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
