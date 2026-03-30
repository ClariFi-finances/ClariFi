namespace API.Models;

public enum PaymentMethodType
{
    Credit,
    Debit,
    Cash
}

public class PaymentMethod : BaseEntity
{
    public required string Name { get; set; }
    public required PaymentMethodType Type { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public User? User { get; }
    public required int UserId { get; set; }

}
