FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["API.Core/API.Core.csproj", "API.Core/"]
COPY ["API.PaymentMethods/API.PaymentMethods.csproj", "API.PaymentMethods/"]
RUN dotnet restore "API.PaymentMethods/API.PaymentMethods.csproj"
COPY . .
WORKDIR "/src/API.PaymentMethods"
RUN dotnet build "API.PaymentMethods.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "API.PaymentMethods.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "API.PaymentMethods.dll"]
