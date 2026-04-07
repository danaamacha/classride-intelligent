# ClassRide — Security Approach

## Philosophy
> Build it secure, then try to hack it yourself.

Every feature follows this pattern:
1. Here's the feature
2. Here's how we secure it (defensive)
3. Here's how a hacker would attack it (offensive)
4. Here's how our code stops that attack

---

## Security Layers

### Authentication Security
- bcrypt password hashing (never plain text)
- JWT access tokens (short expiry)
- Refresh token rotation
- Rate limiting on login endpoint
- Brute force protection
- Secure error messages (no user enumeration)
- Audit log: every LOGIN + FAILED_LOGIN

### Authorization Security
- RBAC (Role Based Access Control) on every endpoint
- Organization isolation (tenant scoping on EVERY query)
- IDOR prevention (you can never access other users' data)
- Privilege escalation prevention
- Ownership checks on all resources

### Input Security
- DTO validation on all inputs (class-validator)
- SQL injection prevention (Prisma handles this)
- XSS prevention
- Mass assignment prevention

### Infrastructure Security
- Rate limiting on all sensitive endpoints
- Suspicious behavior detection
- Generic error messages in production
- No stack traces exposed
- `.env` secrets never in GitHub
- HTTPS in production

### Audit Trail
- Every important action logged
- IP address recorded
- User agent recorded
- Metadata for context
- Tamper-resistant logs

---

## Attacks We Will Test After Building

| Attack | Description |
|---|---|
| Brute force login | Automated password guessing |
| JWT token manipulation | Tamper with token payload |
| Refresh token abuse | Reuse invalidated tokens |
| IDOR | Access other orgs/users data |
| Privilege escalation | Student → admin role |
| Tenant jumping | Org A accessing Org B data |
| SQL injection | Malicious DB queries |
| Mass assignment | Inject extra fields in requests |
| Rate limit bypass | Flood endpoints |

---

## Security Timeline

Security is built in from Day 1 — not added at the end.

- **Week 1–2:** Auth security (bcrypt, JWT, rate limiting, brute force)
- **Week 3:** RBAC + org isolation + IDOR prevention
- **Week 4:** Driver/student data isolation + payment security
- **Week 7:** Full security audit + penetration testing

---

*ClassRide — Built by Dana Amacha*
