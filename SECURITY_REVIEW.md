# Security Review & Production Hardening Plan

## Current Security Issues ⚠️

### Critical Issues

1. **No Password Hashing**
   - Passwords stored in plain text (if stored at all)
   - Environment variable `ADMIN_PASSWORD` is plain text
   - **Risk**: If database is compromised, passwords are exposed

2. **Weak Session Management**
   - Session cookie stores simple string "admin"
   - No session expiration
   - No session rotation
   - **Risk**: Session hijacking, no logout mechanism

3. **No CSRF Protection**
   - No CSRF tokens on state-changing operations
   - **Risk**: Cross-site request forgery attacks

4. **No Rate Limiting**
   - Login attempts unlimited
   - API endpoints unprotected
   - **Risk**: Brute force attacks, DDoS

5. **No Input Validation/Sanitization**
   - User input not validated beyond basic Zod schemas
   - **Risk**: Injection attacks, XSS

6. **Environment Variables Exposure**
   - `.env` file could be committed (check .gitignore)
   - **Risk**: Credentials exposed in git history

### Medium Issues

7. **No HTTPS Enforcement**
   - Cookies set with `secure` flag only in production
   - No redirect from HTTP to HTTPS
   - **Risk**: Man-in-the-middle attacks

8. **No Password Requirements**
   - No minimum length or complexity
   - **Risk**: Weak passwords easily cracked

9. **No Account Lockout**
   - Unlimited login attempts
   - **Risk**: Brute force attacks

10. **Session Cookie Security**
    - `sameSite: "lax"` is good, but could be "strict"
    - No `maxAge` set explicitly
    - **Risk**: Session fixation attacks

## Production Security Requirements for Vercel

### 1. Authentication Security

#### Password Hashing
```typescript
// Use bcrypt with salt rounds
import bcrypt from 'bcryptjs';

// Hash password on registration
const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds

// Verify password on login
const isValid = await bcrypt.compare(password, user.password);
```

#### Session Management
```typescript
// Use secure, httpOnly, sameSite: 'strict' cookies
// Store session token (JWT or session ID) not user ID directly
// Implement session expiration (e.g., 7 days)
// Add session rotation on sensitive operations
```

#### JWT Tokens (Recommended)
```typescript
// Use JWT for stateless authentication
import jwt from 'jsonwebtoken';

// Sign token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

### 2. API Security

#### Rate Limiting
```typescript
// Use Vercel Edge Config or Upstash Redis
// Limit login attempts: 5 per 15 minutes
// Limit API calls: 100 per minute per user
```

#### Input Validation
```typescript
// Use Zod for all inputs
// Sanitize HTML content
// Validate file uploads (if any)
// Limit string lengths
```

#### CORS Configuration
```typescript
// Set proper CORS headers
// Only allow your domain(s)
// No wildcard origins
```

### 3. Database Security

#### SQL Injection Prevention
- ✅ Using Prisma (parameterized queries) - already safe
- Ensure all queries use Prisma, never raw SQL

#### Connection Security
- Use SSL/TLS for database connections
- Vercel Postgres provides this automatically

### 4. Environment Variables

#### Required for Production
```env
# Authentication
JWT_SECRET=<random-64-char-string>
SESSION_SECRET=<random-64-char-string>

# Database (Vercel provides)
DATABASE_URL=<vercel-postgres-url>

# Rate Limiting (if using Upstash)
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>

# Optional: Email service for password reset
SMTP_HOST=<smtp-host>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-pass>
```

#### Security Checklist
- [ ] All secrets in Vercel Environment Variables (not in code)
- [ ] `.env` in `.gitignore` ✅
- [ ] Never commit `.env.local` or `.env.production`
- [ ] Rotate secrets periodically
- [ ] Use different secrets for dev/staging/prod

### 5. HTTPS & Headers

#### Vercel Automatic HTTPS
- ✅ Vercel provides HTTPS automatically
- ✅ Certificates managed automatically
- Ensure `secure: true` in production

#### Security Headers
```typescript
// Add to next.config.js or middleware
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### 6. Password Requirements

```typescript
// Enforce strong passwords
const passwordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  // Optional: check against common password lists
};
```

### 7. Account Security Features

#### Password Reset
- Email-based password reset flow
- Secure token generation (crypto.randomBytes)
- Token expiration (1 hour)
- One-time use tokens

#### Account Lockout
- Lock account after 5 failed login attempts
- Lock duration: 15 minutes
- Unlock via email or time-based

#### Two-Factor Authentication (2FA) - Optional
- TOTP-based 2FA
- Backup codes
- QR code generation

### 8. Logging & Monitoring

#### Security Event Logging
```typescript
// Log security events
- Failed login attempts
- Password changes
- Account lockouts
- Suspicious activity
- API rate limit hits
```

#### Monitoring (Vercel)
- Use Vercel Analytics
- Set up alerts for:
  - High error rates
  - Unusual traffic patterns
  - Failed authentication spikes

### 9. Data Protection

#### Encryption at Rest
- ✅ Vercel Postgres encrypts data at rest
- Ensure sensitive fields are hashed (passwords)

#### Encryption in Transit
- ✅ HTTPS for all connections
- ✅ Database SSL connections

#### Data Privacy
- Implement GDPR compliance if needed
- User data deletion (soft delete already implemented)
- Data export functionality

## Implementation Priority

### Phase 1: Critical (Before Launch)
1. ✅ Password hashing (bcrypt)
2. ✅ JWT or secure session tokens
3. ✅ Rate limiting on login
4. ✅ Input validation/sanitization
5. ✅ Environment variables secured
6. ✅ HTTPS enforcement

### Phase 2: High Priority (Week 1)
7. CSRF protection
8. Security headers
9. Password requirements
10. Account lockout
11. Session expiration

### Phase 3: Medium Priority (Month 1)
12. Password reset flow
13. Security logging
14. Monitoring/alerts
15. Security audit

### Phase 4: Nice to Have
16. 2FA
17. Advanced threat detection
18. Security scanning tools

## Vercel-Specific Security Features

### Built-in Security
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Edge network protection
- ✅ Environment variable encryption

### Recommended Add-ons
- **Upstash Redis**: For rate limiting and session storage
- **Vercel Postgres**: Encrypted, managed database
- **Sentry**: Error tracking and security monitoring
- **Auth0 or Clerk**: If you want managed auth (optional)

## Quick Security Checklist

Before deploying to production:

- [ ] All passwords hashed with bcrypt (12+ rounds)
- [ ] JWT or secure session tokens implemented
- [ ] Rate limiting on auth endpoints
- [ ] All environment variables in Vercel dashboard
- [ ] HTTPS enforced (`secure: true` in production)
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] CSRF protection implemented
- [ ] Password requirements enforced
- [ ] Account lockout after failed attempts
- [ ] Session expiration configured
- [ ] Error messages don't leak sensitive info
- [ ] SQL injection prevention (using Prisma ✅)
- [ ] XSS prevention (React escapes by default ✅)
- [ ] CORS properly configured
- [ ] Logging for security events
- [ ] Monitoring/alerting set up

## Code Examples

### Secure Login Route
```typescript
// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    // Rate limiting check (use Upstash Redis)
    // ... rate limit logic ...
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Log failed attempt
      // ... logging logic ...
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    const res = NextResponse.json({ ok: true });
    res.cookies.set("tide_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Secure Auth Helper
```typescript
// src/lib/auth.ts
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';

export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tide_session")?.value;
  
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email?: string;
    };
    return decoded.userId;
  } catch (error) {
    throw new Error("UNAUTHORIZED");
  }
}
```

## Conclusion

**Current State**: ⚠️ **NOT PRODUCTION READY**

The current implementation is fine for development but needs significant security hardening before production deployment.

**Minimum Requirements for Production**:
1. Password hashing (bcrypt)
2. Secure session tokens (JWT)
3. Rate limiting
4. Input validation
5. Environment variables secured

**Estimated Implementation Time**: 1-2 days for critical security features
