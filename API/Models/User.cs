namespace API.Models;

public class User : BaseEntity
{
    public string CognitoId { get; private set; }
    public string Name { get; private set; }
    public string Email { get; private set; }
    public string Cpf { get; private set; }

    private readonly List<PaymentMethod> _paymentMethods = new();
    public IReadOnlyCollection<PaymentMethod> PaymentMethods => _paymentMethods.AsReadOnly();

    private readonly List<Transaction> _transactions = new();
    public IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();

    // EF Constructor
    protected User() 
    {
        Name = null!;
        Email = null!;
        Cpf = null!;
        CognitoId = null!;
    } 

    public User(string name, string email, string cpf, string cognitoId)
    {
        Name = name;
        Email = email;
        Cpf = cpf;
        CognitoId = cognitoId;
    }

    public void UpdateProfile(string name, string email, string cpf)
    {
        Name = name;
        Email = email;
        Cpf = cpf;
    }
}
