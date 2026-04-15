using API.Infrastructure.Repositories;
using MediatR;

namespace API.Features.PaymentMethods;

public record AddPaymentMethodCommand(string Name, PaymentMethodType Type, int UserId) : IRequest<PaymentMethod>;

public record GetPaymentMethodsQuery() : IRequest<IEnumerable<PaymentMethod>>;

public record UpdatePaymentMethodDetailsCommand(int Id, string Name, PaymentMethodType Type) : IRequest<bool>;

public record RemovePaymentMethodCommand(int Id) : IRequest<bool>;

public class PaymentMethodHandlers :
    IRequestHandler<AddPaymentMethodCommand, PaymentMethod>,
    IRequestHandler<GetPaymentMethodsQuery, IEnumerable<PaymentMethod>>,
    IRequestHandler<UpdatePaymentMethodDetailsCommand, bool>,
    IRequestHandler<RemovePaymentMethodCommand, bool>
{
    private readonly IRepository<PaymentMethod> _repository;

    public PaymentMethodHandlers(IRepository<PaymentMethod> repository)
    {
        _repository = repository;
    }

    public async Task<PaymentMethod> Handle(AddPaymentMethodCommand request, CancellationToken cancellationToken)
    {
        var paymentMethod = new PaymentMethod(request.Name, request.Type, request.UserId);
        await _repository.AddAsync(paymentMethod);
        await _repository.SaveChangesAsync();
        return paymentMethod;
    }

    public async Task<IEnumerable<PaymentMethod>> Handle(GetPaymentMethodsQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetAllAsync();
    }

    public async Task<bool> Handle(UpdatePaymentMethodDetailsCommand request, CancellationToken cancellationToken)
    {
        var paymentMethod = await _repository.GetByIdAsync(request.Id);
        if (paymentMethod is null) return false;

        paymentMethod.UpdateDetails(request.Name, request.Type);
        await _repository.UpdateAsync(paymentMethod);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> Handle(RemovePaymentMethodCommand request, CancellationToken cancellationToken)
    {
        var paymentMethod = await _repository.GetByIdAsync(request.Id);
        if (paymentMethod is null) return false;

        await _repository.DeleteAsync(paymentMethod);
        await _repository.SaveChangesAsync();
        return true;
    }
}

