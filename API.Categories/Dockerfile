FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["API.Core/API.Core.csproj", "API.Core/"]
COPY ["API.Categories/API.Categories.csproj", "API.Categories/"]
RUN dotnet restore "API.Categories/API.Categories.csproj"
COPY . .
WORKDIR "/src/API.Categories"
RUN dotnet build "API.Categories.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "API.Categories.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "API.Categories.dll"]
