namespace API.Models;

public class FixedIncome : BaseEntity
{
    public string Name { get; private set; }
    public decimal Amount { get; private set; }
    public int DayOfMonth { get; private set; }
    public DateTime? LastProcessedDate { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public int UserId { get; private set; }

    // EF Constructor
    protected FixedIncome() 
    {
        Name = null!;
    } 

    public FixedIncome(string name, decimal amount, int dayOfMonth, int userId)
    {
        Name = name;
        Amount = amount;
        DayOfMonth = dayOfMonth;
        UserId = userId;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(string name, decimal amount, int dayOfMonth)
    {
        Name = name;
        Amount = amount;
        DayOfMonth = dayOfMonth;
    }

    public void MarkAsProcessed(DateTime date)
    {
        LastProcessedDate = date;
    }
}
