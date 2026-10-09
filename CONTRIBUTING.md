# Contributing to FleetFlow

Thank you for your interest in contributing to FleetFlow.

## Development Workflow

1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Install dependencies in both `backend/` and `frontend/`
4. Make your changes, following the coding standards below
5. Run linting and type checks: `npm run lint && npm run type-check`
6. Run tests: `npm test`
7. Commit with a descriptive message
8. Open a pull request against the `develop` branch

## Coding Standards

- TypeScript strict mode is enabled — no `any` without justification
- All API inputs must be validated with a Zod schema before use
- All new API endpoints must enforce authorization via middleware
- Never trust client-submitted prices, totals, or roles
- Tests are required for pricing logic, auth flows, and business rules
- Run `npm run lint:fix` and `npm run format` before committing

## Security Rules

- Never commit `.env` files or real secrets
- Never disable authentication or authorization in tests
- New file upload endpoints must validate MIME types and sizes
- Any new CSV export must sanitize fields against formula injection

## Commit Convention

```
feat: add driver assignment to booking workflow
fix: prevent double-booking under concurrent requests  
docs: update API endpoint table in README
test: add pricing edge cases for partial-day rentals
refactor: extract payment reference generator to utils
```

## Reporting Issues

Please use GitHub Issues. For security vulnerabilities, see [SECURITY.md](SECURITY.md).
