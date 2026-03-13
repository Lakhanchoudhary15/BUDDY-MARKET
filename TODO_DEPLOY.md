# Render Deployment Fix - MongoDB Persistence

## Issue: Render SQLite fallback + ephemeral FS

**Fix**: Force MongoDB + verify env.

## Step 1: Verify Render Env Vars
Render Dashboard → Your Service → Environment:
```
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://user:pass@cluster... (full Atlas string)
```

## Step 2: MongoDB Atlas Checklist
1. Cluster active (not paused).
2. Network Access: 0.0.0.0/0 (or Render IPs).
3. DB User: Read/Write all.

## Step 3: Test Live Connection
Visit `YOUR_RENDER_URL/api/db-status`:
- `dbType: 'mongodb'`, `connected: true`.

`YOUR_RENDER_URL/api/env-status` (after code update): Show vars.

## Step 4: Test Persistence
1. Admin `/admin` → Add product.
2. Refresh → persists.
3. Redeploy service → persists.

## Debug Commands (Local Mongo Test)
```
npm install
DB_TYPE=mongodb MONGODB_URI=your_atlas node server.js
# Check logs, test APIs
```

**Expected Logs**: `Connected to MongoDB` (NOT SQLite).
