# standalone API server

```
Client -> Gateway -> Customer API server
```

- language agnostic
- no SDK lock
- true drop in adoption(?)

## Incoming
- Standard HTTP
- API key
- metadata

## Outgoing
- Allow request
- Blocked request
  - `401 Unauthorized` -> invalid revoked anchor being
  - `429 Too Many Requests` -> rate limit exceeded

## Tracking
- API KEY ID
- endpoint -> path + method
- Timestamp
- response status code
- Latency -> bucketed(?)
- rate-limited/allowed

## Explicitly NOT tracked
- request bodies
- response bodies
- PII(?)
- query






