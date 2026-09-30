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

- ana@portus.cv / password123
- geraldo@portus.cv / password123
- noelia@portus.cv / password123

## App structure

- Public pages: /, /platform, /login
- Exporter area: /exporter/*
- CV operations: /cv/*
- Admin area: /admin/*

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Validation

```bash
npx vitest run
npm run build
```

## Notes

This project intentionally uses mock services and local state instead of a live backend so the UI can be reviewed and validated quickly in a demo environment.
