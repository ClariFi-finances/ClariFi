using MediatR;
using Microsoft.EntityFrameworkCore;
using API.Data;
using API.Models;

namespace API.Features.FixedIncomes;

public record GetUserFixedIncomesQuery(int UserId) : IRequest<List<FixedIncome>>;

public class GetUserFixedIncomesHandler(AppDbContext context) : IRequestHandler<GetUserFixedIncomesQuery, List<FixedIncome>>
{
    public async Task<List<FixedIncome>> Handle(GetUserFixedIncomesQuery request, CancellationToken cancellationToken)
    {
        return await context.FixedIncomes
            .Where(f => f.UserId == request.UserId)
            .OrderBy(f => f.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}

public record CreateFixedIncomeCommand(string Name, decimal Amount, int DayOfMonth, int UserId) : IRequest<FixedIncome>;

public class CreateFixedIncomeHandler(AppDbContext context) : IRequestHandler<CreateFixedIncomeCommand, FixedIncome>
{
    public async Task<FixedIncome> Handle(CreateFixedIncomeCommand request, CancellationToken cancellationToken)
    {
        var fixedIncome = new FixedIncome(request.Name, request.Amount, request.DayOfMonth, request.UserId);
        
        context.FixedIncomes.Add(fixedIncome);
        await context.SaveChangesAsync(cancellationToken);
        
        return fixedIncome;
    }
}

public record UpdateFixedIncomeCommand(int Id, string Name, decimal Amount, int DayOfMonth) : IRequest<bool>;

public class UpdateFixedIncomeHandler(AppDbContext context) : IRequestHandler<UpdateFixedIncomeCommand, bool>
{
    public async Task<bool> Handle(UpdateFixedIncomeCommand request, CancellationToken cancellationToken)
    {
        var fixedIncome = await context.FixedIncomes.FindAsync(new object[] { request.Id }, cancellationToken);
        
        if (fixedIncome is null) return false;
        
        fixedIncome.Update(request.Name, request.Amount, request.DayOfMonth);
        await context.SaveChangesAsync(cancellationToken);
        
        return true;
    }
}

public record DeleteFixedIncomeCommand(int Id) : IRequest<bool>;

public class DeleteFixedIncomeHandler(AppDbContext context) : IRequestHandler<DeleteFixedIncomeCommand, bool>
{
    public async Task<bool> Handle(DeleteFixedIncomeCommand request, CancellationToken cancellationToken)
    {
        var fixedIncome = await context.FixedIncomes.FindAsync(new object[] { request.Id }, cancellationToken);
        
        if (fixedIncome is null) return false;
        
        context.FixedIncomes.Remove(fixedIncome);
        await context.SaveChangesAsync(cancellationToken);
        
        return true;
    }
}
