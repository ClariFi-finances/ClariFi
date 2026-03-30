
namespace API.Extensions;

public static class CrudExtensions
{
    public static RouteGroupBuilder MapCrud<TEntity, TCreateDto>(this RouteGroupBuilder group) 
        where TEntity : BaseEntity 
        where TCreateDto : class
    {
        // GET /
        group.MapGet("/", async ([FromServices] IBaseService<TEntity> service) => 
            Results.Ok(await service.GetAllAsync()));
            
        // GET /{id}
        group.MapGet("/{id:int}", async (int id, [FromServices] IBaseService<TEntity> service) => 
        {
            var entity = await service.GetByIdAsync(id);
            return entity is not null ? Results.Ok(entity) : Results.NotFound();
        });

        // POST /
        group.MapPost("/", async (
            [FromBody] TCreateDto dto, 
            [FromServices] IBaseService<TEntity> service, 
            [FromServices] IMapper mapper) =>
        {
            var entity = mapper.Map<TEntity>(dto);
            var createdEntity = await service.CreateAsync(entity); 
            
            // To mimic CreatedAtAction, we return Results.Created with the relative path to the new resource
            return Results.Created($"/{createdEntity.Id}", createdEntity);
        });

        // PUT /{id}
        group.MapPut("/{id:int}", async (
            int id, 
            [FromBody] TEntity entity, 
            [FromServices] IBaseService<TEntity> service) =>
        {
            // The service.UpdateAsync checks if id != entity.Id internally, but doing it early is safe too
            entity.Id = id; 
            var result = await service.UpdateAsync(id, entity);
            return result ? Results.NoContent() : Results.NotFound();
        });

        // DELETE /{id}
        group.MapDelete("/{id:int}", async (int id, [FromServices] IBaseService<TEntity> service) =>
        {
            var result = await service.DeleteAsync(id);
            return result ? Results.NoContent() : Results.NotFound();
        });

        return group;
    }
}
