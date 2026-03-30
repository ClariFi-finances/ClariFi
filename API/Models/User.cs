using System.Text.Json.Serialization;

namespace API.Models;

public class User : BaseEntity
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string CPF { get; set; } // UNIQUE

    public required List<PaymentMethod> PaymentMethods { get; set; }
    public required List<Transaction> Transactions { get; set; }
}
