using API.Infrastructure.Repositories;
using API.Features.FixedIncomes;
using API.Data;
using API.Data.Configs.Mapster;

var builder = WebApplication.CreateBuilder(args);

// ---- DATABASE
builder.Services.AddDbContext<AppDbContext>(options 
    => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") 
                         ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.")
)); 

// ---- SWAGGER
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ClariFi Fixed Incomes API", Version = "v1" });
});

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
            .WithOrigins("http://localhost:5173", "http://localhost:5080")
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

app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseAuthorization();

app.MapGroup("/api/fixedincomes")
    .MapFixedIncomeEndpoints()
    .WithTags("FixedIncomes");

app.Run();
