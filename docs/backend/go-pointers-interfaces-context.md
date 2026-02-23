# Go: Pointers, Interfaces, and Context

Notes from working through Wealthy's LAMF lending service — understanding `*`, `&`, interfaces, and `context.Context`.

---

## The Pointer Confusion (`*` and `&`)

The main source of confusion: `*` does **two different jobs** depending on where it appears.

| Symbol | Where | Meaning |
|--------|-------|---------|
| `*T` | In a type declaration | "a reference/pointer to T" |
| `*p` | On a variable | "follow this pointer, give me the value" |
| `&x` | On a value | "give me the address of x" |

---

## Job 1: `*T` in type declarations — "this is a reference"

```go
type Handler struct {
    mfLoanService *service.MFLoanService  // reference to a service, not a copy of it
    hagridClient  *client.HagridClient    // reference to a client, not a copy
}
```

Compare:
```go
mfLoanService service.MFLoanService   // entire struct copied into Handler
mfLoanService *service.MFLoanService  // just the address stored — no copy
```

Same applies to function parameters:
```go
func NewHandler(svc *service.MFLoanService, hagrid *client.HagridClient) *Handler {
```

`svc *service.MFLoanService` — don't copy the service, share the existing one. Changes to it will affect the original.

---

## Job 2: `&` — "give me the address of this thing"

```go
return &OperationsHandler{
    mfLoanService: mfLoanService,
    hagridClient:  hagridClient,
}
```

`&OperationsHandler{...}` — create the struct, return its **address** (a `*OperationsHandler`).

You'll see this everywhere:
```go
return &models.CreditLimit{
    TotalLimit: 50000,
}
```

Creates a `CreditLimit` and returns a pointer to it. Caller gets a reference, not a copy.

---

## Job 3: `*p` on a variable — follow the pointer

```go
x := 42
p := &x   // p holds the address of x

fmt.Println(*p)  // follow pointer → 42
*p = 99          // follow pointer → set value → x is now 99
```

You rarely need to do this manually in application code. Go auto-dereferences when accessing fields:
```go
h.mfLoanService  // works fine even if h is *Handler — no need to write (*h).mfLoanService
```

---

## When to use `*` (the practical rule)

**Use `*T` when the thing is:**
- A large struct — avoid expensive copying
- Optionally absent — `nil` means "not provided"
- Needs to be mutated by the function/method

**Use `T` (no star) when:**
- It's a small primitive (int, string, bool)
- You explicitly want a copy
- It's an interface (see below — they're already references)

In a Go backend, almost every struct (`Handler`, `Service`, `Client`, `Provider`) travels as `*StructName`. You'll rarely see large structs passed without `*`.

---

## Pointer receivers on methods

```go
func (l *Lead) BeforeCreate(tx *gorm.DB) error {
    l.ID = ulid.MustNew(...)  // this modification sticks
    return nil
}
```

`(l *Lead)` — pointer receiver. Changes to `l` modify the original.

If it were `(l Lead)` — value receiver. Changes to `l` are thrown away (you modified a copy).

**Rule:** If any method on a type uses `*T` receiver, all methods should. Go requires this for interface satisfaction.

---

## Reading pointer code — three questions to ask

**Is `*` in a type declaration?**
→ "This field/parameter holds a reference, not a copy."
```go
mfLoanService *service.MFLoanService
```

**Is `&` on a struct literal or value?**
→ "Create this thing and return a pointer to it."
```go
return &models.CreditLimit{...}
```

**Is `*` used to access a field or call a method?**
→ Go handles this automatically. Just write `h.field`, not `(*h).field`.

---

## Interfaces — already references

`context.Context` is an interface:

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

Interfaces in Go are already reference types under the hood — they store two pointers (type info + data). Passing an interface by value copies those two pointers, not the underlying data. Cheap. Both copies point to the same underlying thing.

This is why you write:
```go
func CheckCreditLimit(ctx context.Context, ...) // no * needed
```

Not:
```go
func CheckCreditLimit(ctx *context.Context, ...) // wrong — double indirection, never do this
```

**Rule: Never use `*` on an interface type.** The Go team explicitly warns against this.

Same applies to any other interface (`io.Reader`, `http.Handler`, `MFLoanProvider`, etc.) — always passed by value.

---

## `context.Context` — what it actually is

A context carries three things through a chain of function calls:

1. **Cancellation signal** — "stop what you're doing, the request was cancelled"
2. **Deadline/timeout** — "give up after 30 seconds"
3. **Request-scoped values** — trace IDs, auth tokens (used sparingly)

### Lifetime in a web server

A context is born when an HTTP request arrives and dies when the response is sent.

```
HTTP request arrives
    → handler pulls ctx from request
        → passes ctx to service
            → service passes ctx to provider
                → provider passes ctx to VoltMoney HTTP call
```

If the user cancels the request, the context is cancelled. Every layer waiting on a DB query or HTTP call gets notified and stops. No wasted work.

### Where ctx comes from in Gin handlers

```go
ctx := c.Request.Context()
```

Gin's HTTP request already has a context attached. You pull it out and pass it down through every function call.

### Cancellation in practice

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(ctx)
```

This context has a 30-second deadline. `server.Shutdown(ctx)` will wait for in-flight requests to finish — but not longer than 30 seconds. This is the graceful shutdown timeout.

---

## Summary table

| Pattern | What you write | Read it as |
|---------|---------------|------------|
| Struct field | `svc *MFLoanService` | "a reference to an MFLoanService" |
| Constructor return | `return &Handler{...}` | "create Handler, return its address" |
| Function param (struct) | `svc *MFLoanService` | "don't copy it, share it" |
| Function param (interface) | `ctx context.Context` | "already a reference, no * needed" |
| Method receiver | `func (h *Handler)` | "can modify h, changes stick" |
| Nil check | `if partner == nil` | "was this pointer ever set?" |
