using Microsoft.AspNetCore.Mvc;
using ClariFi.API.Models;
using ClariFi.API.Services.Interfaces;
using MapsterMapper;

namespace ClariFi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BaseController<T, TCreateDto>(IBaseService<T> service, IMapper mapper) : ControllerBase 
    where T : class, IEntity where TCreateDto : class, IEntity
    {
    [HttpGet]
    public virtual async Task<IActionResult> GetAll() => Ok(await service.GetAllAsync());

    [HttpGet("{id}")]
    public virtual async Task<IActionResult> GetById(int id) =>
        await service.GetByIdAsync(id) is T entity ? Ok(entity) : NotFound();

    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] TCreateDto dto)
    {
        var entity = mapper.Map<T>(dto);
        var createdEntity = await service.CreateAsync(entity);

        return CreatedAtAction(nameof(GetById), new { id = createdEntity.Id }, createdEntity);
    }

    [HttpPut("{id}")]
    public virtual async Task<IActionResult> Update(int id, [FromBody] T entity) =>
        await service.UpdateAsync(id, entity) ? NoContent() : NotFound();

    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Delete(int id) =>
        await service.DeleteAsync(id) ? NoContent() : NotFound();
}