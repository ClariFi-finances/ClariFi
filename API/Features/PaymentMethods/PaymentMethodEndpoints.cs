using MediatR;

namespace API.Features.PaymentMethods;

public record UpdatePaymentDetailsDto(string Name, PaymentMethodType Type);

public static class PaymentMethodEndpoints
{
    public static RouteGroupBuilder MapPaymentMethodEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/add", async ([FromBody] AddPaymentMethodCommand command, [FromServices] IMediator mediator) =>
        {
            var paymentMethod = await mediator.Send(command);
            return Results.Created($"/api/paymentmethods/{paymentMethod.Id}", paymentMethod);
        });

        group.MapGet("/", async ([FromServices] IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetPaymentMethodsQuery())));

        group.MapPut("/{id:int}/update-details", async (int id, [FromBody] UpdatePaymentDetailsDto dto, [FromServices] IMediator mediator) =>
            await mediator.Send(new UpdatePaymentMethodDetailsCommand(id, dto.Name, dto.Type)) 
                ? Results.NoContent()
                : Results.NotFound());

        group.MapDelete("/{id:int}/remove", async (int id, [FromServices] IMediator mediator) =>
            await mediator.Send(new RemovePaymentMethodCommand(id))
                ? Results.NoContent()
                : Results.NotFound());

        return group;
    }
}

