
# API Usage Analytics & Rate Limiting Gateway (Bun + TypeScript)
**DEVELOPMENT: PHASE 1**

> A lightweight, production-minded API gateway that enforces API key authentication, rate limits traffic, and records usage analytics built with **Bun** and **TypeScript**, designed to evolve cleanly from MVP to production.

This project is being built with proper development practices in mind. It's not a get it out there asap project although the development process understands the importance getting a working product out. This is the main objective of the development process where in the first phase the absolute bare minimum has been done with trade off consideration in mind to get the product working fully. 

The following phases of development will upgrade upon this working skeleton to introduce features and tools that'll make this a production ready tool.
## Use case
Most early-stage startups expose APIs but lack:
- visibility into usage
- protection against abuse
- simple quota enforcement
- operational insight into request behavior

This project is a **drop-in gateway** that sits in front of an existing API and provides:
- API key authentication
- per-key, per-endpoint rate limiting
- request-level usage analytics
- internal admin observability endpoints

It is intentionally scoped, **not a full API gateway** like Envoy or Kong.
## What This Is (and Is Not)
### This **is**
- A gateway-shaped **control and observability layer**
- Path-agnostic request pipeline
- Middleware-driven architecture
- Suitable for early-stage startups and internal tools

### ❌ This is **not**
- A routing platform
- A service mesh
- A plugin-based gateway framework
- A business-logic API server

> The goal is **clarity, correctness, and evolution**, not feature maximalism.

## High-Level Architecture

```
Client → Gateway → Upstream API
         │
         ├─ Log request
         ├─ Check API key
         ├─ Check rate limit
         ├─ Proxy request
         └─ Record analytics
```

All client requests pass through a **single request pipeline**.  
Internal gateway endpoints bypass the pipeline.

## Core Features
### 🔐 API Key Authentication
- Keys extracted from:
    - `Authorization: Bearer <key>`
    - `X-API-Key`
- Missing keys rejected early (`401`)
- Identity propagated through request context
### 🚦 Rate Limiting
- Fixed-window rate limiting (MVP)
- Scoped by:
    `apiKey + HTTP method + path`
- Enforced before request forwarding
- Deterministic, debuggable behavior

### 📊 Usage Analytics
For every request (allowed or denied), records:
- API key
- method
- path
- status code
- latency
- timestamp

Analytics are recorded **after** response determination to ensure correctness.
### 🛠 Internal Admin Endpoint
- `GET /usage`
- Protected by `X-Admin-Key`
- Inspect recent usage events
- Optional filtering and limits

## Project Structure

```
src/
├── config.ts           # Config
├── server.ts           # Server + pipeline setup
├── proxy.ts            # Upstream proxy (stubbed)
├── handlers.ts         # Admin handlers
├── types.ts            # Types
├── pipeline/
│   └── middleware.ts   # Pipeline executor
└── middleware/
    ├── logger.ts
    ├── auth.ts
    ├── rateLimiter.ts
    └── analytics.ts
```

This structure separates:

- **request lifecycle**
- **cross-cutting concerns**
- **internal vs external behavior**

## Design Philosophy & Intentional Tradeoffs

This project deliberately starts with **simple, explicit implementations**.
### Logging
**Current**
- `console.log`
- human-readable logs
**Why**
- Zero dependencies
- Easy local debugging
- No opinionated logging format too early
**Production Path**(next phase)
- Replace with structured logger (Pino/Winston)
- Add log levels
- Emit JSON logs for aggregation
### Rate Limiting
**Current**
- Fixed window
- In-memory counters
- Single-instance safe
**Why**
- Easy to reason about
- Deterministic behavior
- Excellent for MVP validation
**Production Path**(next phase)
- Sliding window or token bucket
- Redis-backed counters
- Distributed enforcement
- Configurable per plan
### Analytics Storage
**Current**
- In-memory array
- Synchronous writes
**Why**
- Simplest correctness-first approach
- Clear event model
- No premature persistence decisions
**Production Path**(next phase)
- Async ingestion
- Database persistence (Postgres)
- Batched writes
- Time-based retention
### Proxying
**Current**
- Stubbed response
**Why**
- Focus on gateway logic first
- Avoid mixing proxy complexity too early

**Production Path**
- Full upstream forwarding
- Timeout handling
- Header allow/deny lists
- Retry strategy (optional)
## Request Lifecycle (Concrete)
1. Request arrives at gateway
2. Request context is created
3. Middleware pipeline executes:
    - logging
    - auth
    - rate limiting
4. Request is either:
    - rejected early
    - forwarded to upstream
5. Response is returned
6. Analytics are recorded
7. Context is discarded

> One request = one context = one analytics record
## Configuration
Environment variables:
`PORT=3000 ADMIN_KEY=dev-admin-key`
## Running Locally
`bun install bun run src/index.ts`
Test:
`curl -H "Authorization: Bearer testkey" http://localhost:3000/v1/test curl -H "X-Admin-Key: dev-admin-key" http://localhost:3000/usage`

## Roadmap: From MVP → Production
This system is designed to evolve with less rewrites.
### Phase 1 (Current)
- In-memory rate limiting
- In-memory analytics
- Single instance
- Console logging
### Phase 2
- SQLite / Postgres persistence
- API key table
- Usage event table
- Indexing strategy
### Phase 3
- Redis-backed rate limiting
- Sliding window / token bucket
- Per-plan quotas
### Phase 4
- Async analytics ingestion
- Aggregation endpoints
- Metrics export
### Phase 5
- Full upstream proxying
- Header sanitization
- Observability polish
## Development Practices
This project demonstrates:
- API platform thinking
- middleware architecture
- request lifecycle control
- operational awareness
- intentional tradeoff decisions
It is a **systems-oriented backend tool**.

## Note
This gateway has been made intentionally boring in the right places and explicit everywhere else. That is by design.


