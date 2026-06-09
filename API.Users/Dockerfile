FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["API.Core/API.Core.csproj", "API.Core/"]
COPY ["API.Users/API.Users.csproj", "API.Users/"]
RUN dotnet restore "API.Users/API.Users.csproj"
COPY . .
WORKDIR "/src/API.Users"
RUN dotnet build "API.Users.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "API.Users.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "API.Users.dll"]
