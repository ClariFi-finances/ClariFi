using Microsoft.EntityFrameworkCore;
using API.Data;
using API.Models;

namespace API.Features.FixedIncomes;

public class FixedIncomeBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<FixedIncomeBackgroundService> _logger;

    public FixedIncomeBackgroundService(IServiceProvider serviceProvider, ILogger<FixedIncomeBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Fixed Income Background Service is starting.");

        // Run checking every hour (or a specific time, but hourly is safer for varying timezones/restarts)
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessFixedIncomes(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred processing fixed incomes.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task ProcessFixedIncomes(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var today = DateTime.UtcNow.Date;
        var dayOfMonth = today.Day;

        // Fetch all fixed incomes due today (or earlier this month that haven't been processed yet this month)
        // For simplicity, we just check if it's the exact day and hasn't been processed today
        var fixedIncomesToProcess = await context.FixedIncomes
            .Where(f => f.DayOfMonth == dayOfMonth && (f.LastProcessedDate == null || f.LastProcessedDate.Value.Date < today))
            .ToListAsync(cancellationToken);

        if (!fixedIncomesToProcess.Any())
            return;

        _logger.LogInformation("Found {Count} fixed incomes to process for day {Day}.", fixedIncomesToProcess.Count, dayOfMonth);

        foreach (var fixedIncome in fixedIncomesToProcess)
        {
            // Find a generic category for income or fallback
            var category = await context.Categories.FirstOrDefaultAsync(c => c.UserId == fixedIncome.UserId && c.Name.Contains("Receita"), cancellationToken) 
                           ?? await context.Categories.FirstOrDefaultAsync(c => c.UserId == fixedIncome.UserId, cancellationToken);
                           
            var paymentMethod = await context.PaymentMethods.FirstOrDefaultAsync(p => p.UserId == fixedIncome.UserId, cancellationToken);

            // If user has no category or payment method at all, skip or handle (ideally they have defaults)
            if (category == null || paymentMethod == null)
            {
                _logger.LogWarning("User {UserId} lacks Category or PaymentMethod. Skipping Fixed Income {FixedIncomeId}.", fixedIncome.UserId, fixedIncome.Id);
                continue;
            }

            var transaction = new Transaction(
                title: $"Receita Fixa: {fixedIncome.Name}",
                description: "Adicionado automaticamente",
                amount: fixedIncome.Amount,
                date: DateTime.UtcNow,
                type: TransactionType.Income,
                categoryId: category.Id,
                userId: fixedIncome.UserId,
                paymentMethodId: paymentMethod.Id
            );

            context.Transactions.Add(transaction);
            fixedIncome.MarkAsProcessed(DateTime.UtcNow);
        }

        await context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully processed fixed incomes.");
    }
}
