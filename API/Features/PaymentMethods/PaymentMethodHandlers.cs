using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.PaymentMethods;

/*
 * records are like classes except we can avoid writing boilerplate code like
 * constructors, immutable properties, and it adds a boolean equality check
 */
public record AddPaymentMethodCommand(string Name, PaymentMethodType Type, int UserId) : IRequest<PaymentMethod>;
public record GetPaymentMethodsQuery(int UserId) : IRequest<IEnumerable<PaymentMethod>>;
public record UpdatePaymentMethodDetailsCommand(int Id, string Name, PaymentMethodType Type) : IRequest<bool>;
public record RemovePaymentMethodCommand(int Id) : IRequest<bool>;

public class PaymentMethodHandlers(IRepository<PaymentMethod> repository) :
    /*
     * IRequestHandler is the interface MediatR uses to map the requests to their responsible class
     * the first generic type is the request type, and the second is the response type
     *
     * The pipeline goes like this:
     * MediatR looks at the command variable and sees what type of command it is
     * Then it looks for a class that implements IRequestHandler with that command type as the first generic type
     * Then it calls the Handle method of that class, passing in the command variable and a cancellation token
     * Inside this Handle method MediatR will execute a bunch of additional behaviors including
     * Working with Kestrel to monitor and cancel any bad requests early
     */
    IRequestHandler<AddPaymentMethodCommand, PaymentMethod>,
    IRequestHandler<GetPaymentMethodsQuery, IEnumerable<PaymentMethod>>,
    IRequestHandler<UpdatePaymentMethodDetailsCommand, bool>,
    IRequestHandler<RemovePaymentMethodCommand, bool>
{

    public async Task<PaymentMethod> Handle(AddPaymentMethodCommand request, CancellationToken cancellationToken)
    {
        var paymentMethod = new PaymentMethod(request.Name, request.Type, request.UserId);
        
        await repository.AddAsync(paymentMethod, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return paymentMethod;
    }

    public async Task<IEnumerable<PaymentMethod>> Handle(GetPaymentMethodsQuery request, CancellationToken cancellationToken)
    {
        var paymentMethods = await repository.GetAllAsync(cancellationToken);
        return paymentMethods.Where(p => p.UserId == request.UserId);
    }
    

    public async Task<bool> Handle(UpdatePaymentMethodDetailsCommand request, CancellationToken cancellationToken)
    {
        
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } paymentMethod) return false;

        paymentMethod.UpdateDetails(request.Name, request.Type);
        await repository.UpdateAsync(paymentMethod);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(RemovePaymentMethodCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } paymentMethod) return false;

        await repository.DeleteAsync(paymentMethod);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

