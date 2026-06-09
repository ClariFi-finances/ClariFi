FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["API.Core/API.Core.csproj", "API.Core/"]
COPY ["API.FixedIncomes/API.FixedIncomes.csproj", "API.FixedIncomes/"]
RUN dotnet restore "API.FixedIncomes/API.FixedIncomes.csproj"
COPY . .
WORKDIR "/src/API.FixedIncomes"
RUN dotnet build "API.FixedIncomes.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "API.FixedIncomes.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "API.FixedIncomes.dll"]
