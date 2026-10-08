FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props QandA.slnx global.json ./
COPY src/QandA.Api/QandA.Api.csproj src/QandA.Api/
COPY tests/QandA.Api.Tests/QandA.Api.Tests.csproj tests/QandA.Api.Tests/
RUN dotnet restore QandA.slnx
COPY . .

# `docker compose run --rm api-tests` runs this stage against the compose database.
FROM build AS test
ENTRYPOINT ["dotnet", "test", "--solution", "QandA.slnx", "--no-restore"]

FROM build AS publish
RUN dotnet publish src/QandA.Api/QandA.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app .
# Data-protection keys (they encrypt the auth cookie) live in a volume so sessions survive restarts.
RUN mkdir /keys && chown app /keys
USER app
ENV ASPNETCORE_HTTP_PORTS=8080 \
    DataProtection__KeysPath=/keys
EXPOSE 8080
ENTRYPOINT ["dotnet", "QandA.Api.dll"]
