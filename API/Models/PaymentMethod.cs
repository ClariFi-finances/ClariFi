using System.Text.Json.Serialization;

namespace API.Models;

public enum PaymentMethodType
{
    Credit,
    Debit,
    Cash
}

public class PaymentMethod : BaseEntity
{
    public string Name { get; private set; }
    public PaymentMethodType Type { get; private set; }

    [JsonIgnore]
    public User? User { get; private set; }
    public int UserId { get; private set; }

    protected PaymentMethod() { } // EF Constructor

    public PaymentMethod(string name, PaymentMethodType type, int userId)
    {
        Name = name;
        Type = type;
        UserId = userId;
    }

    public void UpdateDetails(string name, PaymentMethodType type)
    {
        Name = name;
        Type = type;
    }
}
