# Dripline: Reverse-Proxy Usage Enforcement for AI SaaS

Dripline is an opinionated reverse-proxy gateway built for AI-powered SaaS products that incur usage-based LLM costs. It enforces per-user hard limits before upstream execution, preventing surprise bills and abuse.

It is not a generic API gateway, it is a cost-control layer.

## Problem

LLM APIs are usage-priced and unpredictable. A single abusive user or integration bug can generate unexpected costs. Traditional gateways optimize for throughput and latency, not deterministic cost enforcement.

Dripline ensures that no user exceeds their configured daily quota before a cost-incurring endpoint is executed.

## Architecture

Dripline runs as a reverse proxy with strict separation between:

#### Data Plane

- Authenticates API keys
- Resolves end-user identity
- Detects metered endpoints
- Enforces daily usage limits
- Proxies requests upstream
- Records usage analytics

#### Control Plane

- Create and revoke end users
- Issue API keys
- Inspect per-user usage
- View system-wide usage summary

#### Request Lifecycle

Request enters gateway ->
API key resolves to internal end-user identity ->
Metered endpoint detection ->
Atomic usage check + increment (daily window) ->
If allowed -> proxied upstream ->
If limit exceeded -> 429 returned before upstream call

**Enforcement happens before LLM execution.**

## Core Capabilities (MVP)

- Per-end-user usage attribution
- Deterministic daily hard limits (UTC window)
- Atomic DB-backed enforcement
- Reverse proxy with timeout handling
- Upstream error attribution
- Restart-safe persistence
- Admin control plane

Usage is currently request-based (1 request = 1 unit). Token-based metering is planned.

## Key Design Decisions

#### Reverse Proxy Enforcement
Limits are enforced pre-execution to guarantee cost control.

#### Fail-Closed Model
If enforcement cannot complete, the request is blocked.

#### Synchronous Limit Check
Correctness is prioritized over availability.

#### Internal Identity Model
All enforcement uses internal UUIDs. External IDs are mapped but never trusted for enforcement.

#### Fixed Daily Windows (MVP)
Chosen for predictability and operational simplicity.

## What This Is Not

- a generic API manager
- an enterprise plugin gateway
- a billing engine
- a token-parsing middleware (yet)

## Tech Stack

Bun · TypeScript · Elysia · SQLite (Postgres-ready)

## Development Status
Core enforcement and proxy layer operational.

_This readme was indeed edited by AI to be more compact. Detailed readme with system diagram and file system will be available once all development phases are complete!_