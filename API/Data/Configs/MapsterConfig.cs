using Mapster;
using ClariFi.API.Models;

namespace ClariFi.API.Configuration;

public class MapsterConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // Use like this: config.NewConfig<fooDTO, foo>();
    }
}