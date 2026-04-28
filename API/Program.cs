using API.Infrastructure.Repositories;
using API.Features.Users;
using API.Features.PaymentMethods;
using API.Features.Transactions;

var builder = WebApplication.CreateBuilder(args);

// To set your credentials, run:
// dotnet user-secrets init
// dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=ClariFi;Username=giovanisims;Password=admin"
// check with: dotnet user-secrets list

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
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// ---- MEDIATR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// ---- CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSwagger", policy =>
    {
        policy.WithOrigins("http://localhost:5080", "https://localhost:7109")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGroup("/api/users")
    .MapUserEndpoints()
    .WithTags("Users");

app.MapGroup("/api/paymentmethods")
    .MapPaymentMethodEndpoints()
    .WithTags("PaymentMethods");

app.MapGroup("/api/transactions")
    .MapTransactionEndpoints()
    .WithTags("Transactions");

app.UseCors("AllowSwagger"); 
app.UseHttpsRedirection();
app.UseAuthorization();

await DataSeeder.SeedDataAsync(app.Services);

app.Run();