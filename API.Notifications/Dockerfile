FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["API.Core/API.Core.csproj", "API.Core/"]
COPY ["API.Notifications/API.Notifications.csproj", "API.Notifications/"]
RUN dotnet restore "API.Notifications/API.Notifications.csproj"
COPY . .
WORKDIR "/src/API.Notifications"
RUN dotnet build "API.Notifications.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "API.Notifications.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "API.Notifications.dll"]
