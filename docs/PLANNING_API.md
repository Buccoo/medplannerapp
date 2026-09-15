# MedPlanner planning API

`planning-api` is the authenticated service boundary prepared for a future MCP/ChatGPT Work integration. It accepts `POST` JSON containing an `operation`. The user always comes from the bearer token; a `user_id` supplied by a client is ignored.

## Operations

- `snapshot.read`: doctors, facilities, products, targets, plans and active appointments.
- `agenda.read`: active appointments, optionally filtered by `from` and `to` (`YYYY-MM-DD`).
- `appointment.propose`: creates only an unlocked `proposto`; a duplicate `doctor_id` in the week is rejected.
- `import.dry_run`: returns staging rows without applying them.
- `import.apply_certain`: applies only certain doctor rows with a required idempotency key and pre-import snapshot.
- `weekly_plan.generate`: generates only unlocked proposals around existing anchors and returns conflicts.
- `changeset.read`: reads one owned changeset.
- `bag.calculate`: computes samples from approved visit goals.

No generic write or delete operation exists. Future scopes are `read`, `propose`, and `apply_certain`; only the first two semantics are enabled now. External secrets and service-role keys must never be added to the client.

```json
{"operation":"agenda.read","from":"2026-09-14","to":"2026-09-18"}
```

Writes pass through RLS and database audit triggers. A future `apply_certain` implementation must create a snapshot and changeset in the same server-side transaction before applying rows.
