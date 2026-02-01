# Todo List Feature Implementation Plan

## Overview
Add a comprehensive "Things I Want To Do" tab alongside the existing "Things I Do Every Day" feature. This is a standard todo list system with advanced tracking and organization.

## Database Schema Changes

### New Models

#### 1. TodoItem (Master Bank)
```prisma
model TodoItem {
  id            String      @id @db.Uuid
  userId        String      @map("user_id")
  title         String
  description   String?
  notes         String?     // Text-only notes/links
  intensity     String      // "chill" | "moderate" | "kinda_hard" | "damn_son"
  daysNeeded    Int?        // Estimated days to complete
  isFun         Boolean     @default(false)
  isWork        Boolean     @default(false)
  isPlay        Boolean     @default(false)
  customLabels  String[]    @default([]) // Array of custom user labels
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  deletedAt     DateTime?   @map("deleted_at")
  user          User        @relation(fields: [userId], references: [id])
  todos         Todo[]      // Instances on todo lists
  completions   TodoCompletion[]
  
  @@index([userId])
  @@index([userId, deletedAt])
}
```

#### 2. Todo (Todo List Items)
```prisma
model Todo {
  id            String      @id @db.Uuid
  todoItemId    String      @map("todo_item_id") @db.Uuid
  userId        String      @map("user_id")
  listType      String      // "today" | "tomorrow" | "this_week" | "this_month"
  doneByDate    DateTime?    @map("done_by_date")
  scheduledTime DateTime?   @map("scheduled_time") // Specific time if needed
  order         Int         @default(0) // For drag-and-drop ordering
  status        String      @default("pending") // "pending" | "completed" | "pushed" | "missed"
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  todoItem      TodoItem    @relation(fields: [todoItemId], references: [id])
  user          User        @relation(fields: [userId], references: [id])
  completions   TodoCompletion[]
  
  @@index([userId, listType])
  @@index([userId, listType, order])
}
```

#### 3. TodoCompletion (Tracking)
```prisma
model TodoCompletion {
  id            String      @id @db.Uuid
  todoId        String      @map("todo_id") @db.Uuid
  todoItemId    String      @map("todo_item_id") @db.Uuid
  userId        String      @map("user_id")
  completedAt   DateTime    @map("completed_at")
  wasOnTime     Boolean     // Completed by doneByDate
  notes         String?
  
  todo          Todo        @relation(fields: [todoId], references: [id])
  todoItem      TodoItem    @relation(fields: [todoItemId], references: [id])
  user          User        @relation(fields: [userId], references: [id])
  
  @@index([userId, completedAt])
}
```

#### 4. TodoPush (Track when tasks are pushed)
```prisma
model TodoPush {
  id            String      @id @db.Uuid
  todoId        String      @map("todo_id") @db.Uuid
  userId        String      @map("user_id")
  fromListType  String      @map("from_list_type")
  toListType    String      @map("to_list_type")
  pushedAt      DateTime    @default(now()) @map("pushed_at")
  
  todo          Todo        @relation(fields: [todoId], references: [id])
  user          User        @relation(fields: [userId], references: [id])
  
  @@index([userId, pushedAt])
}
```

#### 5. DailyMood (Mood/Feeling Tracker)
```prisma
model DailyMood {
  id            String      @id @db.Uuid
  userId        String      @map("user_id")
  localDate     DateTime    @map("local_date") @db.Date
  feelings      String[]    // ["happy", "sad", "angry", "tired", "energized", "accomplished", "stressed", "anxious"]
  rating        Int         // 0-10 scale
  notes         String?
  createdAt     DateTime    @default(now()) @map("created_at")
  user          User        @relation(fields: [userId], references: [id])
  
  @@unique([userId, localDate])
  @@index([userId, localDate])
}
```

#### 6. UserLabels (Custom Labels)
```prisma
model UserLabel {
  id            String      @id @db.Uuid
  userId        String      @map("user_id")
  name          String
  color         String?     // Optional color for UI
  createdAt     DateTime    @default(now()) @map("created_at")
  user          User        @relation(fields: [userId], references: [id])
  
  @@unique([userId, name])
  @@index([userId])
}
```

### Update User Model
```prisma
model User {
  // ... existing fields
  todoItems     TodoItem[]
  todos         Todo[]
  todoCompletions TodoCompletion[]
  todoPushes    TodoPush[]
  dailyMoods    DailyMood[]
  userLabels    UserLabel[]
}
```

## API Routes

### Todo Items (Master Bank)
- `GET /api/todo-items` - List all items in bank (with filters)
- `POST /api/todo-items` - Create new item
- `PUT /api/todo-items/[id]` - Update item
- `DELETE /api/todo-items/[id]` - Soft delete item

### Todos (List Items)
- `GET /api/todos?listType=today` - Get todos for list type
- `POST /api/todos` - Add item to list
- `PUT /api/todos/[id]` - Update (reorder, change date, etc.)
- `DELETE /api/todos/[id]` - Remove from list (back to bank)
- `POST /api/todos/[id]/push` - Push to another list
- `POST /api/todos/[id]/complete` - Mark as completed

### Stats
- `GET /api/todos/stats` - Get completion stats, rates, etc.

### Mood
- `GET /api/mood?date=2026-02-01` - Get mood for date
- `POST /api/mood` - Log mood
- `GET /api/mood/history?start=...&end=...` - Get mood history

### Labels
- `GET /api/labels` - Get user labels
- `POST /api/labels` - Create label
- `DELETE /api/labels/[id]` - Delete label

## Frontend Components

### New Tab Structure
- "Every Day" tab (existing)
- "To Do" tab (new)

### To Do Tab Components

1. **MasterBankPanel**
   - List of all todo items
   - Filter by labels, intensity, fun/work/play
   - Add new item form
   - Edit/delete items

2. **TodoListView**
   - Tabs: Today, Tomorrow, This Week, This Month
   - Drag-and-drop reordering
   - Actions: Complete, Push, Remove, Delete
   - Show done by date, scheduled time
   - Calendar view option

3. **TodoItemForm**
   - Title, description
   - Intensity selector
   - Days needed input
   - Fun/Work/Play toggles
   - Custom labels selector
   - Done by date picker
   - Scheduled time picker (optional)
   - Notes textarea

4. **TodoStatsPanel**
   - Completion rate
   - Push rate
   - Add vs do rate
   - Total completed
   - Total pending
   - Time in bank stats
   - Charts/graphs

5. **MoodTracker** (on home page)
   - Feeling checkboxes
   - Rating slider (0-10)
   - Notes textarea
   - Submit button

6. **MoodHistory**
   - View mood over time
   - Calendar view
   - Trends

## Implementation Order

### Phase 1: Database & API (Foundation)
1. Update Prisma schema
2. Create migrations
3. Build API routes for TodoItem
4. Build API routes for Todo
5. Build API routes for Mood
6. Build API routes for Labels

### Phase 2: Master Bank UI
7. Create MasterBankPanel component
8. Add/edit/delete items
9. Filtering and search

### Phase 3: Todo Lists UI
10. Create TodoListView component
11. Today/Tomorrow/Week/Month tabs
12. Drag-and-drop reordering
13. Add to list from bank
14. Complete/push/remove actions

### Phase 4: Stats & Tracking
15. TodoStatsPanel component
16. Calculate and display stats
17. Charts for completion rates

### Phase 5: Mood Tracker
18. MoodTracker component on home page
19. Mood history view
20. Integration with daily completion graph

### Phase 6: Polish
21. Calendar view
22. Time scheduling UI
23. Notes editing
24. Custom labels management

## Key Features Summary

### Todo Item Properties
- ✅ Title, description, notes
- ✅ Intensity: chill, moderate, kinda hard, damn son
- ✅ Days needed estimate
- ✅ Labels: fun/not fun, work/play, custom labels
- ✅ Done by date
- ✅ Scheduled time (optional)

### Todo List Views
- ✅ Today
- ✅ Tomorrow
- ✅ This Week
- ✅ This Month
- ✅ Calendar view

### Actions
- ✅ Drag and drop reorder
- ✅ Complete
- ✅ Push to tomorrow/another list
- ✅ Remove to bank
- ✅ Delete entirely

### Tracking & Stats
- ✅ Completion tracking
- ✅ Push tracking
- ✅ Add vs do rate
- ✅ Time in bank (created vs started)
- ✅ Completion efficiency
- ✅ Missed tasks tracking

### Mood Tracker
- ✅ Feelings: happy, sad, angry, tired, energized, accomplished, stressed, anxious
- ✅ Rating: 0-10 scale
- ✅ Notes
- ✅ Daily logging
- ✅ History view

## Estimated Implementation Time

- Phase 1: 2-3 hours (Database + API)
- Phase 2: 1-2 hours (Master Bank UI)
- Phase 3: 2-3 hours (Todo Lists UI)
- Phase 4: 1-2 hours (Stats)
- Phase 5: 1 hour (Mood Tracker)
- Phase 6: 1-2 hours (Polish)

**Total: ~8-13 hours**
