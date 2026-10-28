# PORTUS Portal

PORTUS is a mock operational portal for maritime export workflows in Cabo Verde. It is built as a frontend-only demo with role-based navigation, mock authentication, and realistic domain records for exporters, cargo, volumes, containers, vessels, documents, seals, and audits.

## Product scope

- Public landing page and product overview
- Role-based login and protected app shell
- Exporter operations dashboard and registries
- CV operator workflows for vessels, gate passes, seals, and audits
- Admin user registry and granular navigation rules
- Mock data layer that mirrors a backend contract without requiring a real API

## Demo users

Use the existing mock credentials in the app:

- ana@portus.cv / PortusDemo!2026-CV
- agente@portus.cv / PortusDemo!2026-CV (field collection agent)

## App structure

- Public pages: /, /platform, /login
- Exporter area: /exporter/*
- CV operations: /cv/*
- Field agent: /agent/collections
- Admin area: /admin/*

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Field collection agent

The field agent can register a collection with sender, recipient, declared contents, weight,
volume or dimensions, and a photograph. OCR runs in the browser in Portuguese and suggests
editable field values; the agent must review and explicitly confirm the data before saving.

Collections and photographs are stored in the browser's IndexedDB for this demo only. They are
not shared across devices and are not connected to the operational portal or a production backend.
The demo login is not production authentication.

## Validation

```bash
npx vitest run
npm run cypress:run
npm run build
```

For interactive E2E runs, use `npm run cypress:open`. Cypress starts the Next.js development
server and injects a deterministic OCR result for its tests.

## Notes

This project intentionally uses mock services and local state instead of a live backend so the UI
can be reviewed and validated quickly in a demo environment.
