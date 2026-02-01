# Quick Start Guide

## 🚀 Get Running in 3 Steps

### Step 1: Start PostgreSQL

**Option A: Docker (if Docker Desktop is running)**
```bash
docker run --name tide-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tide \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: Local PostgreSQL**
```bash
# Check if PostgreSQL is running
brew services start postgresql@15

# Create database
createdb tide
```

### Step 2: Setup Database
```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### Step 3: Start Dev Server
```bash
npm run dev
```

Then open **http://localhost:3000** and login with:
- Username: `admin`
- Password: `password`

---

## 🧪 Testing Checklist

- [ ] Login works
- [ ] Create a task (max 50 chars, max 20 tasks)
- [ ] Mark task as DONE (green checkmark)
- [ ] Mark task as PARTIAL (orange circle)
- [ ] Clear status (X button - makes it MISSED)
- [ ] View progress grid (28 days)
- [ ] Delete task (hover to see trash icon)
- [ ] Create multiple tasks
- [ ] Log different dates

## 🛠️ Useful Commands

```bash
# View database in browser
npx prisma studio

# Run tests
npm test

# Check database connection
psql -U postgres -d tide -c "SELECT 1;"
```

## ❌ Troubleshooting

**"Cannot connect to database"**
- Make sure PostgreSQL is running
- Check `.env` DATABASE_URL matches your setup
- For Docker: `docker ps` to see if container is running

**"Port 3000 already in use"**
```bash
lsof -ti:3000 | xargs kill -9
```

**"Prisma client not generated"**
```bash
npx prisma generate
```
