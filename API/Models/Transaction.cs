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
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required decimal Amount { get; set; }
    public required DateTime Date { get; set; }
    public required TransactionType Type { get; set; }
    public required TransactionCategory Category { get; set; }
    public string? InstallmentInfo { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public User? User { get; }
    public required int UserId { get; set; }


    [System.Text.Json.Serialization.JsonIgnore]
    public PaymentMethod? PaymentMethod { get; }
    public required int PaymentMethodId { get; set; }

}
