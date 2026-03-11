# MongoDB Atlas Setup Guide for Buddy Market

This guide will help you set up MongoDB Atlas (free tier) for permanent product data storage that persists across deployments.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email (Google, GitHub, or email)
3. Verify your email address

## Step 2: Create Free Cluster

1. After login, click **"Create"** to start a new project
2. Name it "BuddyMarket" and click **"Create Project"**
3. Click **"Build a Database"**
4. Select **"Free"** (M0) tier
5. Choose **"AWS"** as the cloud provider (recommended)
6. Select a region closest to you (e.g., Mumbai - ap-south-1)
7. Click **"Create Cluster"**

**Wait 1-3 minutes for the cluster to be created**

## Step 3: Create Database User

1. In the cluster page, click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Create credentials:
   - **Authentication Method**: Password
   - **Username**: `buddymarket` (or any username)
   - **Password**: Create a strong password (e.g., `Bm@rt2024!`)
   - **Database User Privileges**: "Read and Write to any database"
4. Click **"Add User"**

## Step 4: Network Access (Important!)

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. For testing, select **"Allow Access from Anywhere (0.0.0.0/0)"**
4. Click **"Confirm"**

> ⚠️ **Security Note**: For production, restrict to Render's IP addresses only.

## Step 5: Get Connection String

1. Click **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Copy the connection string:

```
mongodb+srv://<username>:<password>@cluster.mongodb.net/buddymarket?retryWrites=true&w=majority
```

5. Replace `<username>` and `<password>` with your actual credentials

Example:
```
mongodb+srv://buddymarket:Bm@rt2024!@cluster.mongodb.net/buddymarket?retryWrites=true&w=majority
```

## Step 6: Configure on Render

### Option A: Using Render Dashboard

1. Go to your Render dashboard
2. Select your Buddy Market service
3. Click **"Environment"** in the left sidebar
4. Add these environment variables:

| Key | Value |
|-----|-------|
| `DB_TYPE` | `mongodb` |
| `MONGODB_URI` | Your connection string from Step 5 |

5. Click **"Save Changes"**
6. Redeploy your service

### Option B: Using .env file

1. Create a `.env` file in your project root:

```env
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://buddymarket:Bm@rt2024!@cluster.mongodb.net/buddymarket?retryWrites=true&w=majority
PORT=80
```

2. Make sure `.env` is in your `.gitignore` (it already is)

3. Deploy to Render with these variables

## Step 7: Verify Database Connection

After deployment, check the logs:

1. In Render dashboard, go to your service
2. Click **"Logs"**
3. Look for: `Connected to MongoDB`

You should see the message indicating successful connection.

## Step 8: Test Persistence

1. Go to your admin panel
2. Add, edit, or delete a product
3. Redeploy your service (or restart it)
4. Refresh the page - **products should still be there!**

## Troubleshooting

### "MongoServerSelectionTimeoutError"
- Check your network access settings (Step 4)
- Verify your username/password in the connection string
- Make sure cluster status is "Available"

### "AuthenticationFailed"
- Double-check username and password in connection string
- Special characters in password must be URL-encoded:
  - `@` → `%40`
  - `!` → `%21`
  - `#` → `%23`

### Data Not Persisting
- Make sure `DB_TYPE=mongodb` is set correctly
- Check that `MONGODB_URI` is correct
- Verify cluster is not paused (free tier pauses after inactivity)

## Cost

The MongoDB Atlas M0 free tier includes:
- 512 MB storage
- Shared RAM
- Perfect for small e-commerce sites

**Cost: FREE** (no credit card required for signup)

