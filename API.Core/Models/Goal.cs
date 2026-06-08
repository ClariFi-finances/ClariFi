using System.Text.Json.Serialization;

namespace API.Models;

public class Goal : BaseEntity
{
    public string Name { get; private set; }
    public string? Icon { get; private set; }
    public string? Color { get; private set; }
    public decimal TargetAmount { get; private set; }
    public decimal CurrentAmount { get; private set; }
    public DateTime? Deadline { get; private set; }
    public DateTime CreatedAt { get; private set; }

    [JsonIgnore]
    public User? User { get; private set; }
    public int UserId { get; private set; }

    // EF Constructor
    protected Goal()
    {
        Name = string.Empty;
    }

    public Goal(string name, string? icon, string? color, decimal targetAmount, decimal currentAmount, DateTime? deadline, int userId)
    {
        Name = name;
        Icon = icon;
        Color = color;
        TargetAmount = targetAmount;
        CurrentAmount = currentAmount;
        Deadline = deadline;
        CreatedAt = DateTime.UtcNow;
        UserId = userId;
    }

    public void UpdateDetails(string name, string? icon, string? color, decimal targetAmount, DateTime? deadline)
    {
        Name = name;
        Icon = icon;
        Color = color;
        TargetAmount = targetAmount;
        Deadline = deadline;
    }

    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentException("Deposit amount must be positive.");
        CurrentAmount += amount;
    }

    public void Withdraw(decimal amount)
    {
        if (amount <= 0) throw new ArgumentException("Withdraw amount must be positive.");
        if (amount > CurrentAmount) throw new ArgumentException("Insufficient funds in this goal.");
        CurrentAmount -= amount;
    }
}
