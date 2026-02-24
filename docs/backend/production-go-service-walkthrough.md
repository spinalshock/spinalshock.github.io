# Production Go Service — How It All Works

Notes from walking through Wealthy's LAMF (Loans Against Mutual Funds) lending service. A real production Go backend.

---

## Entry Point

Every Go program starts at `main()`. In production apps, `main.go` is deliberately tiny — it just boots up and hands off control.

```go
func main() {
    if err := rootCmd.Execute(); err != nil {
        log.Fatal(err)
    }
}
```

### The `_` import trick

```go
_ "github.com/joho/godotenv/autoload"
```

The `_` means: import this package only for its **side effects**, don't use it directly. `godotenv/autoload` automatically reads `.env` and loads all variables into the process environment before anything else runs. That's how `DB_HOST`, API keys etc. are available at startup without you explicitly loading them.

### `init()` vs `main()`

`init()` runs automatically before `main()` in Go. Used for setup — registering subcommands, initialising package-level state etc.

---

## Why Production Backends Are CLI Apps

Hobby projects: one thing — start the server, done.

Production backends need multiple distinct operations that **share the same codebase**:
- `server` — long-running HTTP process
- `cli migrate` — short-lived task, runs once and exits
- `cli create-partner` — admin utility
- `webhooks subscribe` — one-time infrastructure setup

If these were separate programs, they'd all duplicate DB connection logic, config loading, models etc. One CLI app with subcommands means one binary, shared codebase.

**Same pattern in other ecosystems:**
- Django: `python manage.py runserver`, `python manage.py migrate` — same app, different commands
- Rails: `rails server`, `rails db:migrate` — same thing

The library that makes this work in Go is **Cobra** — same library used by `kubectl`, `docker`, `hugo`.

---

## DB Migrations

Your database schema evolves over time — new columns, new tables, renamed fields. Migrations are **versioned, recorded changes** to the schema.

**The problem they solve:** 3 engineers, 3 laptops, 1 production DB. Engineer A adds a column locally. How does everyone else's DB know to add it? Migrations solve this — each change is recorded, and the app checks what version the DB is at and runs only what's missing.

**GORM AutoMigrate:** In this codebase, GORM looks at your Go structs and automatically figures out what SQL to run to make the DB match them. Runs at server startup before accepting requests. No manual SQL needed for additive changes (new columns, new tables).

**Lesson learned the hard way:** Adding `not null` to a new column on a table with existing rows will fail — existing rows got `NULL` when the column was added. Use `default:0` without `not null` for new numeric columns on existing tables.

---

## Kubernetes Concepts (via Proxmox analogy)

| Proxmox | Kubernetes |
|---|---|
| Physical PC/server | **Node** |
| Proxmox cluster (multiple PCs) | **Cluster** |
| LXC container | **Pod** |
| OS template | **Container Image** |

Key difference: Proxmox LXCs often run multiple services. Kubernetes pods run **one focused process**. More fine-grained.

### Types of workloads

**Deployment** — keep N pods running forever, restart on crash. Your HTTP server. Like an LXC with auto-restart.

**Job** — run once, complete, exit. DB migrations. Like spinning up an LXC, running a script, shutting it down.

**CronJob** — Job on a schedule. "Run every night at 2am."

**Worker** — a long-running Deployment that processes a queue instead of HTTP requests. Pulls tasks from Redis/Pub-Sub, processes them in the background. No HTTP involved.

**Sidecar** — a helper container running alongside your main container in the same pod, sharing its network and storage. Examples:
- Log collector — reads your app's logs, ships them to centralised logging
- Proxy (Envoy/Istio) — intercepts traffic for security/observability
- Secrets agent — fetches credentials and writes to shared volume

Your app doesn't know or care about sidecars. They handle cross-cutting concerns invisibly.

### Typical deploy flow

```
Code merged → CI builds binary → new pod starts
→ AutoMigrate runs (schema updated)
→ server starts listening
→ old pods terminated
```

---

## cmd/server.go — What Happens at Startup

The full startup sequence in order:

### 1. Migrations
```go
database.InitDB()      // connect to PostgreSQL
database.AutoMigrate() // sync core tables
database.DB.AutoMigrate(&quicklend.QuicklendPartner{}, ...) // provider-specific tables
database.DB.AutoMigrate(&voltmoney.VoltmoneyCustomer{}, ...)
```

Runs before any requests are accepted.

### 2. Clients (HTTP clients for internal services)
```go
hydraClient    // agent permissions & customer relationships
novaClient     // MF portfolio data (Wealthy's own data)
hagridClient   // customer profile/KYC
phaserClient   // MF tracker data (third-party)
voltmoneyClient // the loan provider
notificationClient // alerts/campaigns
```

These are just structs that know how to make HTTP calls to other internal microservices. Each service in the company (Hydra, Nova, Hagrid, Phaser) is its own microservice — this app talks to them over HTTP.

### 3. Service + Provider registration
```go
mfLoanService := service.NewMFLoanService(novaClient, phaserClient)
mfLoanService.RegisterProvider("quicklend", quicklendProvider)
mfLoanService.RegisterProvider("voltmoney", voltmoneyProvider)
```

The **service layer** is the business logic brain. It doesn't care which loan provider is being used — it talks to a common interface. Providers are registered by name so the right one gets called based on the request.

### 4. Dependency injection into handlers
```go
handler := api.NewHandler(mfLoanService, hydraClient, ...)
opsHandler := api.NewOperationsHandler(mfLoanService, hagridClient)
```

Handlers are what respond to HTTP requests. They're given everything they need upfront (service, clients) — this is **dependency injection**. No global variables, no reaching out to grab things. Everything is explicit and testable.

### 5. Router setup (Gin)
```go
router := gin.Default()
router.GET("/health/", ...)  // health check for Kubernetes liveness probes
```

**Gin** is the HTTP framework (like Express in Node.js). `gin.Default()` creates a router with logging and panic recovery middleware built in.

### 6. Route groups
```go
clientGroup    → /customers/api/v0/loans/...   (requires X-W-User-Id header)
partnerGroup   → /partners/api/v0/loans/...    (requires X-W-Agent-Id header)
operationsGroup → /operations/api/v0/loans/... (no auth — internal only)
webhookGroup   → /webhooks/:provider/:key/     (secret key verification)
```

Different route groups = different auth requirements. Same handler logic underneath, different access controls layered on top via middleware.

### 7. Graceful shutdown
```go
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit  // block here until signal received

server.Shutdown(ctx) // 30 second timeout to finish in-flight requests
```

When Kubernetes wants to terminate a pod, it sends `SIGTERM`. The server catches it, stops accepting new requests, waits up to 30 seconds for in-flight requests to finish, then exits cleanly. This is **graceful shutdown** — no requests get cut off mid-flight.

### 8. OTel (OpenTelemetry) metrics
When enabled, every request gets counted with its status code, path, and method. This feeds into dashboards/alerting so the team can see traffic, error rates, latency etc. Standard observability tooling in production.

---

## Layering Convention (important for this codebase)

| Layer | Location | Purpose | Tags |
|---|---|---|---|
| DB models | `internal/database/models.go` | GORM structs — talk to PostgreSQL | `gorm:"..."` only |
| Domain models | `internal/models/` | Business logic structs — returned from services, serialised in API responses | `json:"..."` only |
| Service | `internal/service/` | Business logic, orchestration. Returns domain models. DB save is internal detail. | none |
| Handlers | `internal/api/` | HTTP request/response. Calls service, returns domain models as JSON. | none |
| Providers | `internal/providers/` | External loan provider integrations (VoltMoney, Quicklend) | none |
| Clients | `internal/client/` | Internal microservice HTTP clients | none |

**Key rule:** Never add json tags to DB models. Never add gorm tags to domain models. Each layer has one job.

**JSONB fields in DB models are write-only** from the app's perspective — data gets marshalled and stored, never unmarshalled back in the API layer. The service returns the domain model it already has in memory.

---

## Health Check

```go
router.GET("/health/", func(c *gin.Context) {
    c.JSON(200, gin.H{"status": "ok"})
})
```

Every production service has this. Kubernetes hits it periodically — if it returns anything other than 2xx, Kubernetes considers the pod unhealthy and restarts it. Called a **liveness probe**.
