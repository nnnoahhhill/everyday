# Multi-User Support Implementation Plan

## Current State
- Single hardcoded admin user (ADMIN_USER_ID from .env)
- Simple username/password authentication
- All API routes use ADMIN_ID directly
- Session cookie stores "admin" string

## Implementation Plan

### Phase 1: Authentication & User Management

#### 1.1 Update Authentication System
**Files to modify:**
- `src/lib/auth.ts` - Get user ID from session
- `src/app/api/auth/login/route.ts` - Store user ID in session
- `src/app/api/auth/register/route.ts` - **NEW** - User registration endpoint

**Changes:**
- Change session cookie to store user ID instead of "admin"
- Add password hashing (bcrypt)
- Create user registration endpoint
- Update `requireAuth()` to return user ID

#### 1.2 User Registration
**New file:** `src/app/api/auth/register/route.ts`
- Accept username, password, email (optional)
- Hash password with bcrypt
- Create user in database with uuidv7
- Return success/error

**New file:** `src/app/register/page.tsx`
- Registration form (username, password, email)
- Link to login page
- Similar styling to login page

### Phase 2: Update API Routes

#### 2.1 Replace ADMIN_ID with Current User
**Files to modify:**
- `src/app/api/tasks/route.ts` - Use current user ID
- `src/app/api/tasks/[id]/route.ts` - Use current user ID
- `src/app/api/task-log/route.ts` - Use current user ID
- `src/app/api/grid/route.ts` - Use current user ID

**Changes:**
- Remove `ADMIN_ID` constant
- Get user ID from `requireAuth()` (update to return user ID)
- Replace all `ADMIN_ID` references with current user ID
- Ensure users can only access their own data

#### 2.2 Update Auth Helper
**File:** `src/lib/auth.ts`
```typescript
export async function requireAuth() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("tide_session")?.value;
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId; // Return user ID instead of void
}
```

### Phase 3: Database Schema Updates

#### 3.1 Add Password Field
**File:** `prisma/schema.prisma`
```prisma
model User {
  id        String    @id @db.Uuid
  username  String    @unique
  email     String?
  password  String    // Hashed password
  createdAt DateTime  @default(now()) @map("created_at")
  deletedAt DateTime? @map("deleted_at")
  tasks     Task[]
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_user_password
```

#### 3.2 Seed Initial Admin User (Optional)
Create migration or seed script to create admin user if needed.

### Phase 4: Frontend Updates

#### 4.1 Login Page Updates
**File:** `src/app/login/page.tsx`
- Add link to registration page
- Update to work with new auth system

#### 4.2 Registration Page
**New file:** `src/app/register/page.tsx`
- Form: username, password, email (optional)
- Submit to `/api/auth/register`
- Redirect to login on success
- Show errors if registration fails

#### 4.3 User Context/Store
**New file:** `src/store/use-user-store.ts` or use React Context
- Store current user info
- Provide user ID to components that need it
- Handle logout

#### 4.4 Logout Functionality
**New file:** `src/app/api/auth/logout/route.ts`
- Clear session cookie
- Return success

**Update:** Add logout button to dashboard header

### Phase 5: Security & Validation

#### 5.1 Password Requirements
- Minimum length (8 characters)
- Optional: complexity requirements
- Validate on registration

#### 5.2 Input Validation
- Username: unique, min length, allowed characters
- Email: valid format (if provided)
- Password: strength requirements

#### 5.3 Rate Limiting (Optional)
- Prevent brute force attacks
- Limit login attempts
- Use Next.js middleware or external service

### Phase 6: Testing

#### 6.1 Test Scenarios
- User registration
- User login
- User logout
- Data isolation (user A can't see user B's data)
- Multiple users with same task names
- User deletion/soft delete

#### 6.2 Update Existing Tests
- Update API tests to use user authentication
- Add multi-user test scenarios

## Implementation Order

1. **Phase 1.1** - Update authentication system (auth.ts, login route)
2. **Phase 3.1** - Add password field to User model
3. **Phase 1.2** - Create registration endpoint and page
4. **Phase 2.1 & 2.2** - Update all API routes to use current user
5. **Phase 4.1-4.4** - Update frontend (login, register, logout)
6. **Phase 5** - Add security and validation
7. **Phase 6** - Testing

## Dependencies to Add

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

## Environment Variables

Update `.env`:
- Remove `ADMIN_USER_ID` (or keep for migration purposes)
- Keep `ADMIN_USERNAME` and `ADMIN_PASSWORD` only if needed for initial admin creation

## Migration Strategy

1. Create migration for password field
2. Hash existing admin password (if migrating existing user)
3. Update session format gradually or all at once
4. Test with new user registration
5. Verify existing admin still works

## Notes

- All existing data will be associated with the admin user
- Consider data migration strategy if needed
- Session format change will log out existing users (acceptable for this transition)
- User model already exists in schema, just needs password field
