using API.Extensions;
using API.Models;

var builder = WebApplication.CreateBuilder(args);

// To set your credentials, run:
// dotnet user-secrets init
// dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=ClariFi;Username=giovanisims;Password=admin"
// check with: dotnet user-secrets list

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// ---- DATABASE
builder.Services.AddDbContext<AppDbContext>(options 
    => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.")
)); 

// ---- SWAGGER
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ---- MAPSTER
builder.Services.AddMapsterConfiguration();

// ---- BUSINESS LOGIC
builder.Services.AddAuthorization(); 
builder.Services.AddScoped(typeof(IBaseService<>), typeof(BaseService<>));



var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Example using actual DTOs once you build them:
app.MapGroup("/api/users")
    .MapCrud<User, User>()
    .WithTags("Users");

// Example using the entity as its own DTO for quick testing purposes:
app.MapGroup("/api/paymentmethods")
    .MapCrud<PaymentMethod, PaymentMethod>()
    .WithTags("PaymentMethods");

app.MapGroup("/api/transactions")
    .MapCrud<Transaction, Transaction>()
    .WithTags("Transactions");


app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();