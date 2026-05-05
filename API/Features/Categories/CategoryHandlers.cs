using API.Infrastructure.Repositories;
using API.Models;
using MediatR;

namespace API.Features.Categories;

public record AddCategoryCommand(string Name, string? Icon, string? Color, int UserId) : IRequest<Category>;
public record GetCategoriesQuery() : IRequest<IEnumerable<Category>>;
public record UpdateCategoryCommand(int Id, string Name, string? Icon, string? Color) : IRequest<bool>;
public record RemoveCategoryCommand(int Id) : IRequest<bool>;

public class CategoryHandlers(IRepository<Category> repository) :
    IRequestHandler<AddCategoryCommand, Category>,
    IRequestHandler<GetCategoriesQuery, IEnumerable<Category>>,
    IRequestHandler<UpdateCategoryCommand, bool>,
    IRequestHandler<RemoveCategoryCommand, bool>
{
    public async Task<Category> Handle(AddCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = new Category(request.Name, request.Icon, request.Color, request.UserId);
        
        await repository.AddAsync(category, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return category;
    }

    public async Task<IEnumerable<Category>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
        => await repository.GetAllAsync(cancellationToken);

    public async Task<bool> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } category) return false;

        category.UpdateDetails(request.Name, request.Icon, request.Color);
        await repository.UpdateAsync(category);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(RemoveCategoryCommand request, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(request.Id, cancellationToken) is not { } category) return false;

        await repository.DeleteAsync(category);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
