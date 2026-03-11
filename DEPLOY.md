# Buddy Market Deployment Guide

This guide covers deploying Buddy Market with MongoDB for permanent data persistence.

## Prerequisites

1. Node.js installed locally
2. GitHub account
3. Render.com account
4. MongoDB Atlas account (free tier)

---

## Quick Start (Local Development)

### 1. Clone and Install

```bash
cd buddy-market
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file:

```env
# For local SQLite (default - no setup needed)
DB_TYPE=sqlite
PORT=80

# OR for local MongoDB
DB_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/buddymarket
PORT=80
```

### 3. Run Locally

```bash
npm start
```

Visit `http://localhost` to see the site.

---

## Deploy to Render (with MongoDB)

### Step 1: Prepare Your Code

1. Make sure you have a `.env` file with:
   ```env
   DB_TYPE=mongodb
   MONGODB_URI=mongodb+srv://<your-connection-string>
   PORT=80
   ```

2. Ensure `.gitignore` includes:
   ```
   node_modules/
   .env
   buddy_market.db
   ```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add MongoDB support for persistent storage"
git push origin main
```

### Step 3: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: buddy-market
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   ```
   DB_TYPE = mongodb
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/buddymarket?retryWrites=true&w=majority
   PORT = 80
   ```
6. Click **"Create Web Service"**

### Step 4: Wait for Deployment

- Build takes ~2-3 minutes
- First deployment may take longer
- Check "Logs" for connection status

---

## Verifying Database Connection

### Method 1: Check Logs

In Render dashboard:
1. Select your service
2. Click **"Logs"**
3. Look for: `Connected to MongoDB` or `SQLite database initialized`

### Method 2: Use API Endpoint

After deployment, visit:
```
https://your-app.onrender.com/api/products
```

- If empty array `[]`: Database connected but empty
- If products shown: Database working correctly!
- If error: Check environment variables

### Method 3: Admin Panel

1. Go to `/admin`
2. Login with: `admin` / `VS1234`
3. Add a product
4. Restart/redeploy the service
5. Refresh - product should still be there!

---

## Managing Products

### Adding Products

1. Navigate to `/admin`
2. Click **"Login"**
3. Enter password: `VS1234`
4. Go to **Products** tab
5. Click **"Add Product"**
6. Fill in details and save

### Editing Products

1. In Products tab, click the **Edit** button (pencil icon)
2. Modify details
3. Click **"Save Product"**

### Deleting Products

1. Click the **Delete** button (trash icon)
2. Confirm deletion

---

## Understanding the Database

### Default Behavior

- On **first run**: Default products are inserted automatically
- On **subsequent runs**: Existing products are preserved
- After **admin changes**: All changes persist in MongoDB

### Data Structure

**Products Collection:**
```json
{
  "_id": "...",
  "name": "Parle-G - 500g",
  "price": 35,
  "image": "https://...",
  "category": "Biscuits",
  "description": "...",
  "stock": 50,
  "inStock": true
}
```

---

## Troubleshooting

### Products Reset After Restart

**Cause**: Using SQLite without persistent disk OR MongoDB not configured.

**Solution**:
1. Ensure `DB_TYPE=mongodb` in environment variables
2. Verify `MONGODB_URI` is correct
3. Check logs for connection errors

### "Cannot Connect to Database"

1. Verify MongoDB Atlas cluster is not paused
2. Check Network Access allows connections (0.0.0.0/0)
3. Verify credentials in connection string

### Build Failed

- Check `package.json` has correct scripts
- Ensure all dependencies are listed
- Check Node version compatibility (14+)

---

## Security Recommendations

1. **Change Admin Password**: Update in MongoDB or use admin panel
2. **Restrict Network Access**: In MongoDB Atlas, limit to Render IPs
3. **Use Environment Variables**: Never commit secrets to GitHub

---

## Support

If products still don't persist:
1. Check Render logs for errors
2. Verify MongoDB Atlas cluster is active
3. Confirm environment variables are set correctly
4. Review [MongoDB Setup Guide](./MONGO_SETUP.md)

