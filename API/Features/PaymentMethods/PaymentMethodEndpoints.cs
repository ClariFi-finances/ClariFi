using API.Infrastructure.Repositories;

namespace API.Features.PaymentMethods;

public static class PaymentMethodEndpoints
{
    public static RouteGroupBuilder MapPaymentMethodEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", async ([FromBody] CreatePaymentMethodDto dto, [FromServices] IRepository<PaymentMethod> repository) =>
        {
            var paymentMethod = new PaymentMethod(dto.Name, dto.Type, dto.UserId);
            await repository.AddAsync(paymentMethod);
            await repository.SaveChangesAsync();
            return Results.Created($"/api/paymentmethods/{paymentMethod.Id}", paymentMethod);
        });

        group.MapGet("/", async ([FromServices] IRepository<PaymentMethod> repository) =>
        {
            return Results.Ok(await repository.GetAllAsync());
        });

        group.MapPut("/{id:int}", async (int id, [FromBody] UpdatePaymentMethodDto dto, [FromServices] IRepository<PaymentMethod> repository) =>
        {
            var paymentMethod = await repository.GetByIdAsync(id);
            if (paymentMethod is null) return Results.NotFound();

            paymentMethod.UpdateDetails(dto.Name, dto.Type);
            await repository.UpdateAsync(paymentMethod);
            await repository.SaveChangesAsync();
            
            return Results.NoContent();
        });

        group.MapDelete("/{id:int}", async (int id, [FromServices] IRepository<PaymentMethod> repository) =>
        {
            var paymentMethod = await repository.GetByIdAsync(id);
            if (paymentMethod is null) return Results.NotFound();

            await repository.DeleteAsync(paymentMethod);
            await repository.SaveChangesAsync();
            
            return Results.NoContent();
        });

        return group;
    }
}

public record CreatePaymentMethodDto(string Name, PaymentMethodType Type, int UserId);
public record UpdatePaymentMethodDto(string Name, PaymentMethodType Type);

