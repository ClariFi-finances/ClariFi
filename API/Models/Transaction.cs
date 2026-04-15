namespace API.Models;

public enum TransactionType
{
    Income,
    Expense
}

public enum TransactionCategory
{
    Health,
    Tasks,
    Taxes,
    Leisure,
    Food,
    Reserve,
    Fixed,
    Bills
}

public class Transaction : BaseEntity
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime Date { get; private set; }
    public TransactionType Type { get; private set; }
    public TransactionCategory Category { get; private set; }
    public string? InstallmentInfo { get; private set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public User? User { get; private set; }
    public int UserId { get; private set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public PaymentMethod? PaymentMethod { get; private set; }
    public int PaymentMethodId { get; private set; }

    protected Transaction() { } // EF Constructor

    public Transaction(string title, string description, decimal amount, DateTime date, 
        TransactionType type, TransactionCategory category, int userId, int paymentMethodId, string? installmentInfo = null)
    {
        Title = title;
        Description = description;
        Amount = amount;
        Date = date;
        Type = type;
        Category = category;
        UserId = userId;
        PaymentMethodId = paymentMethodId;
        InstallmentInfo = installmentInfo;
    }

    public void UpdateDetails(string title, string description, decimal amount, TransactionCategory category, DateTime date)
    {
        Title = title;
        Description = description;
        Amount = amount;
        Category = category;
        Date = date;
    }
}
