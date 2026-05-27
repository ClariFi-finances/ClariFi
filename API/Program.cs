using API.Infrastructure.Repositories;
using API.Features.Users;
using API.Features.PaymentMethods;
using API.Features.Transactions;
using API.Features.Categories;
using API.Features.Goals;
using API.Features.FixedIncomes;
using API.Features.Notifications;

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
builder.Services.AddHostedService<FixedIncomeBackgroundService>();

// ---- MEDIATR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// ---- CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",  
                "http://localhost:5080"  
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ---- SWAGGER com CORS
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ClariFi API", Version = "v1" });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseAuthorization();

app.MapGroup("/api/users")
    .MapUserEndpoints()
    .WithTags("Users");

app.MapGroup("/api/paymentmethods")
    .MapPaymentMethodEndpoints()
    .WithTags("PaymentMethods");

app.MapGroup("/api/transactions")
    .MapTransactionEndpoints()
    .WithTags("Transactions");

app.MapGroup("/api/categories")
    .MapCategoryEndpoints()
    .WithTags("Categories");

app.MapGroup("/api/goals")
    .MapGoalEndpoints()
    .WithTags("Goals");

app.MapGroup("/api/notifications")
    .MapNotificationEndpoints()
    .WithTags("Notifications");

app.MapGroup("/api/fixedincomes")
    .MapFixedIncomeEndpoints()
    .WithTags("FixedIncomes");

await DataSeeder.SeedDataAsync(app.Services);

app.Run();