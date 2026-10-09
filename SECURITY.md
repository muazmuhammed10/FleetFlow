# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in FleetFlow, please **do not** open a public GitHub issue.

Instead, report it via email to `security@fleetflow.example` with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix

We aim to acknowledge reports within 48 hours and resolve critical issues within 14 days.

---

## Security Controls

### Authentication
- Passwords hashed with **Argon2id** (memoryCost: 64 MB, timeCost: 3, parallelism: 4)
- JWT access tokens (15-minute expiry) + refresh tokens (7-day expiry, stored and revocable)
- Refresh tokens are revoked on logout and password change
- Constant-time comparison for auth to prevent timing attacks
- Rate limiting: 10 attempts per 15 minutes on all auth endpoints

### Authorization
- Role-based access control: `CUSTOMER`, `RENTAL_AGENT`, `FLEET_MANAGER`, `ADMINISTRATOR`
- Every API endpoint enforces server-side role checks — frontend UI is not the security boundary
- IDOR protection: customers can only access their own bookings, profiles, and notifications
- Public registration always assigns `CUSTOMER` role — no self-elevation possible

### Input Validation
- All request bodies validated with **Zod** schemas before processing
- Parameterized database queries via **Prisma ORM** — no raw SQL injection risk
- CSV exports sanitize fields to prevent formula injection attacks
- File upload restrictions enforce MIME type and size limits (when implemented)

### Transport & Headers
- **Helmet.js** sets security headers: CSP, X-Frame-Options, X-Content-Type-Options, etc.
- CORS restricted to configured `CORS_ORIGIN` only
- Secure cookie configuration when applicable

### Sensitive Data
- No secrets committed to version control — `.env` is gitignored
- Passwords, tokens, and authorization headers are never logged
- Stack traces suppressed in production error responses
- Payment data is clearly marked as **simulated** — no real card data is processed or stored

### Audit Logging
- All sensitive operations are logged: logins, password changes, booking changes, payments, admin actions
- Audit log is append-only and accessible only to administrators

### Password Reset
- Tokens are cryptographically random (32 bytes / 64 hex chars)
- Tokens expire after 1 hour and are single-use
- Response always returns success to prevent email enumeration

---

## Known Limitations

1. **Simulated payments only** — no real payment processing. Do not use in production without a real payment provider and server-side payment verification.
2. **Email** — uses Ethereal (fake) SMTP in development. Configure real SMTP before production use.
3. **File uploads** — document storage is stubbed. Implement cloud storage (S3) for production.
4. **No HTTPS enforcement** — configure TLS termination at your reverse proxy (nginx/Cloudflare) before deployment.
5. **No MFA** — multi-factor authentication is not implemented in this version.
6. **Rate limiting** — uses in-memory store. Use Redis-backed rate limiting in multi-instance deployments.

---

## Development vs Production

- Seed passwords in `.env.example` are for development only — change all credentials before deployment
- `NODE_ENV=production` suppresses stack traces in error responses
- Docker images run as non-root user `node`
