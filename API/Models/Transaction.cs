namespace API.Models;

public enum TransactionType
{
    Income,
    Expense
}

public class Transaction : BaseEntity
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime Date { get; private set; }
    public TransactionType Type { get; private set; }
    public int CategoryId { get; private set; }
    public string? InstallmentInfo { get; private set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public Category? Category { get; private set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public User? User { get; private set; }
    public int UserId { get; private set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public PaymentMethod? PaymentMethod { get; private set; }
    public int PaymentMethodId { get; private set; }

    // EF Constructor
    protected Transaction()
    {
        Title = null!;
        Description = null!;
    } 

    public Transaction(string title, string description, decimal amount, DateTime date, 
        TransactionType type, int categoryId, int userId, int paymentMethodId, string? installmentInfo = null)
    {
        Title = title;
        Description = description;
        Amount = amount;
        Date = date;
        Type = type;
        CategoryId = categoryId;
        UserId = userId;
        PaymentMethodId = paymentMethodId;
        InstallmentInfo = installmentInfo;
    }

    public void UpdateDetails(string title, string description, decimal amount, int categoryId, DateTime date)
    {
        Title = title;
        Description = description;
        Amount = amount;
        CategoryId = categoryId;
        Date = date;
    }
}
