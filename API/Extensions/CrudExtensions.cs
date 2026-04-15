
namespace API.Extensions;

public static class CrudExtensions
{
    public static RouteGroupBuilder MapCrud<TEntity, TCreateDto>(this RouteGroupBuilder group) 
        where TEntity : BaseEntity 
        where TCreateDto : class
    {
        group.MapGet("/", async ([FromServices] IBaseService<TEntity> service) => 
            Results.Ok(await service.GetAllAsync()));
            
        group.MapGet("/{id:int}", async (int id, [FromServices] IBaseService<TEntity> service) => 
        {
            var entity = await service.GetByIdAsync(id);
            return entity is not null ? Results.Ok(entity) : Results.NotFound();
        });

        group.MapPost("/", async (
            [FromBody] TCreateDto dto, 
            [FromServices] IBaseService<TEntity> service, 
            [FromServices] IMapper mapper) =>
        {
            var entity = mapper.Map<TEntity>(dto);
            var createdEntity = await service.CreateAsync(entity); 
            
            return Results.Created($"/{createdEntity.Id}", createdEntity);
        });

        group.MapPut("/{id:int}", async (
            int id, 
            [FromBody] TEntity entity, 
            [FromServices] IBaseService<TEntity> service) =>
        {
            entity.Id = id; 
            var result = await service.UpdateAsync(id, entity);
            return result ? Results.NoContent() : Results.NotFound();
        });

        group.MapDelete("/{id:int}", async (int id, [FromServices] IBaseService<TEntity> service) =>
        {
            var result = await service.DeleteAsync(id);
            return result ? Results.NoContent() : Results.NotFound();
        });

        return group;
    }
}
