using Mapster;
using API.Models;

namespace API.Data.Configs;

public class MapsterConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // Use like this: config.NewConfig<fooDTO, foo>();
    }
}