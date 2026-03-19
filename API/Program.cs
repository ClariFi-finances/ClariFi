var builder = WebApplication.CreateBuilder(args);
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
builder.Services.AddScoped(typeof(IBaseService<>), typeof(BaseService<>));


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();