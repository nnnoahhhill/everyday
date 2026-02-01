# Local Development Setup

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Start PostgreSQL with Docker:**
```bash
docker run --name tide-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tide \
  -p 5432:5432 \
  -d postgres:15
```

2. **Run database migrations:**
```bash
npx prisma migrate dev --name init
```

3. **Generate Prisma client:**
```bash
npx prisma generate
```

4. **Start the dev server:**
```bash
npm run dev
```

5. **Open in browser:**
   - Go to http://localhost:3000
   - You'll be redirected to `/login`
   - Login with:
     - Username: `admin`
     - Password: `password`

### Option 2: Using Local PostgreSQL

1. **Start PostgreSQL** (if not running):
```bash
# macOS with Homebrew
brew services start postgresql@15

# Or start manually
pg_ctl -D /usr/local/var/postgres start
```

2. **Create database:**
```bash
createdb tide
# Or if you need to specify user:
psql -U $(whoami) -c "CREATE DATABASE tide;"
```

3. **Update .env** if needed:
```env
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/tide?schema=public"
```

4. **Run migrations:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Start dev server:**
```bash
npm run dev
```

## Testing the Application

### 1. Login
- Navigate to http://localhost:3000
- You'll be redirected to `/login`
- Use credentials: `admin` / `password`

### 2. Create Tasks
- Type a task name in the input field (max 50 chars)
- Click the + button or press Enter
- You can create up to 20 active tasks

### 3. Log Task Status
- Click the **CircleDot** icon (○) to mark as PARTIAL
- Click the **Check** icon (✓) to mark as DONE
- Click the **X** icon to clear status (marks as MISSED)

### 4. View Progress Grid
- Scroll down to see the 28-day progress grid
- Green = DONE
- Orange = PARTIAL
- Gray = MISSED

### 5. Delete Tasks
- Hover over a task to see the delete button (trash icon)
- Click to delete

## Useful Commands

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check database connection
npx prisma db pull
```

## Troubleshooting

### Database Connection Issues

**Error: "connection refused"**
- Make sure PostgreSQL is running
- Check if port 5432 is available
- Verify DATABASE_URL in .env

**Error: "role does not exist"**
- Create the postgres user or use your system user
- Update .env with correct username

**Error: "database does not exist"**
- Create the database: `createdb tide`
- Or use Docker option above

### Port Already in Use

If port 3000 is taken:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## Environment Variables

Your `.env` file should contain:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tide?schema=public"
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
ADMIN_API_KEY=super-long-random-string
ADMIN_USER_ID=018d6f0f-0000-7000-8000-000000000000
```

## Next Steps

1. ✅ Database setup
2. ✅ Run migrations
3. ✅ Start dev server
4. ✅ Test login
5. ✅ Create tasks
6. ✅ Log daily status
7. ✅ View progress grid
