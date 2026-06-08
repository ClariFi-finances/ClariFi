namespace API.Data.Configs.Mapster;

public static class MapsterConfig
{
    public static IServiceCollection AddMapsterConfiguration(this IServiceCollection services)
    {
        var config = TypeAdapterConfig.GlobalSettings;
        
        // Scan the current assembly to find classes that implement IRegister
        // e.g., your custom mapping rules
        config.Scan(typeof(MapsterConfig).Assembly);

        services.AddSingleton(config);
        services.AddScoped<IMapper, ServiceMapper>();

        return services;
    }
}