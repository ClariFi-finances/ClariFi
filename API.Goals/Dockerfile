FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["API.Core/API.Core.csproj", "API.Core/"]
COPY ["API.Goals/API.Goals.csproj", "API.Goals/"]
RUN dotnet restore "API.Goals/API.Goals.csproj"
COPY . .
WORKDIR "/src/API.Goals"
RUN dotnet build "API.Goals.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "API.Goals.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "API.Goals.dll"]
