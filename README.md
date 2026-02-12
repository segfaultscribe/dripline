# Dripline: API Usage Analytics & Hard Limits for LLM-Powered SaaS

> NOTE: Dripline has been recently upgraded from a generic gateway to a gateway focused on usage enforcement for AI SaaS

Dripline is a reverse-proxy API gateway designed specifically for AI-powered SaaS applications that incur usage-based LLM costs. It sits in front of cost-incurring endpoints, attributes usage per end user, and enforces hard limits before upstream calls are made — preventing surprise bills, abuse, and runaway usage.

This is not a generic API gateway. It is an opinionated cost-control layer for teams shipping AI products.

## Why dripline Exists

LLM APIs are expensive and usage scales unpredictably. A single abusive user, infinite loop, or integration bug can cause sudden cost spikes.

Traditional API gateways focus on:
* Latency
* Throughput
* Generic rate limiting

Dripline focuses on:
* **Per-user usage attribution**
* **Deterministic daily usage limits**
* **Blocking requests before cost is incurred**
* **Clear operational control for founders**

The primary goal is cost predictability.

## Architecture Overview

dripline is built as a reverse proxy with a strict middleware pipeline and a clear separation between:

* **Data plane** – handles customer traffic and enforcement
* **Control plane** – admin APIs for user and key management

### Request Flow

1. Request enters the gateway.
2. A `RequestContext` is created.
3. Authentication resolves the API key to an internal end-user identity.
4. Metering classifies whether the endpoint is cost-incurring.
5. Usage enforcement checks persisted counters against configured limits.
6. If allowed, the request is proxied upstream.
7. Usage counters are finalized and persisted.

If a limit would be exceeded, the gateway returns a 429 response and the upstream is never called.

This guarantees cost protection before LLM execution.

## Core Features (MVP)

### Per-End-User Identity

* Each API key maps to an internal end user.
* Limits are enforced per end user, not globally.
* Revoking a user revokes all associated keys.

### Metered Endpoint Protection

* Only explicitly configured path prefixes (e.g. `/ai/*`) are considered cost-incurring.
* Non-metered endpoints pass through normally.
* Metering is explicit and deterministic.

### Daily Hard Usage Limits

* Fixed UTC daily window.
* One usage unit per metered request (v1).
* Synchronous enforcement before proxying.
* Persistent counters survive restarts.

### Usage Persistence

* Composite primary key `(end_user_id, window_start)`
* Atomic upsert-based increments
* Restart-safe and deterministic

### Admin Control Plane

* Create end users
* Issue API keys
* Revoke users (hard stop)
* Inspect configured limits

## Design Decisions & Tradeoffs

### Reverse Proxy Model

Enforcement must happen before LLM execution. SDK-based tracking or log-based analysis is reactive and unsafe for cost control. A reverse proxy guarantees pre-execution enforcement.

### Synchronous Enforcement

Authentication and limit checks are synchronous. This slightly increases latency but guarantees deterministic cost protection. Availability is intentionally traded for correctness.

### Internal vs External User IDs

External customer user IDs are stored for mapping only. All enforcement and counters use internal UUIDs to ensure referential integrity and system independence.

### Fixed Daily Windows (MVP)

A simple UTC daily window was chosen over rolling or sliding windows for:

* Simplicity
* Predictability
* Lower operational complexity

This can evolve to rolling or weighted limits later.

### No Token Counting (Yet)

V1 meters per request, not per token. This avoids deep LLM parsing and keeps enforcement fast. Token-weighted usage can be introduced later without breaking the core model.

### No Dynamic Route Configuration (Yet)

Metered endpoints are currently path-prefix based and configured at runtime. Future versions will allow admin-configurable metered routes loaded into memory without per-request DB lookups.

## Failure & Safety Model

* If the database is unavailable → requests fail closed.
* If enforcement fails → request is blocked.
* If the process crashes before proxy → no cost incurred.
* If it crashes after proxy → acceptable undercount (rare edge case).

Correctness is prioritized over availability.

## What This Is Not

dripline is not:

* A Kong or NGINX replacement
* A multi-protocol API manager
* An enterprise gateway with plugins and SSO
* A billing system

It is a focused cost-control gateway for AI SaaS teams.

## MVP Goals

The MVP guarantees:

* A user cannot exceed their configured daily request limit.
* Over-limit requests are blocked before LLM execution.
* Usage persists across restarts.
* Founders can control and revoke users immediately.

Future work includes:

* Token-based metering
* Configurable metered routes
* Aggregated usage analytics endpoints
* Async write optimization
* Redis-backed distributed enforcement


## Tech Stack

* Bun
* TypeScript
* Elysia
* SQLite (Postgres-ready)
* Structured middleware pipeline
* Reverse proxy forwarding

## Project Status

MVP in active development.
Core enforcement engine implemented.
Focus: deterministic cost protection for AI-powered SaaS.
