using API.Extensions;
using API.Models;
using API.Infrastructure.Repositories;
using API.Features.Users;

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
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Example using explicit Feature Endpoints mapped instead of generic CRUD
app.MapGroup("/api/users")
    .MapUserEndpoints()
    .WithTags("Users");

/* 
// Migrate other features to domain-specific modules similarly
app.MapGroup("/api/paymentmethods")
    ...
*/

app.UseHttpsRedirection();
app.UseAuthorization();

app.Run();