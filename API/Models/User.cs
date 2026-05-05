namespace API.Models;

public class User : BaseEntity
{
    public string CognitoId { get; private set; }

    private readonly List<PaymentMethod> _paymentMethods = new();
    public IReadOnlyCollection<PaymentMethod> PaymentMethods => _paymentMethods.AsReadOnly();

    private readonly List<Transaction> _transactions = new();
    public IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();

    // EF Constructor
    protected User() 
    {
        CognitoId = null!;
    } 

    public User(string cognitoId)
    {
        CognitoId = cognitoId;
    }

    public void UpdateCognitoId(string cognitoId)
    {
        CognitoId = cognitoId;
    }
}
