using Microsoft.EntityFrameworkCore;
using ClariFi.API.Data;
using ClariFi.API.Services; using ClariFi.API.Services.Interfaces;
using Mapster;
using MapsterMapper;

var builder = WebApplication.CreateBuilder(args);
// Set your enviroment variables with this, replace the defaults with your credentials:
// export Host=localhost;Database=my_db;Username=my_user;Password=my_password"
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// ---- DATABASE
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString)); 
// ---- SWAGGER
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// ---- MAPSTER
builder.Services.AddMapster();
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