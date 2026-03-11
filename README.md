# Buddy Market - Online Grocery Store

A full-featured online grocery store for college campuses, built with Node.js, Express, and SQLite/MongoDB.

## Features

- Product catalog with categories (Biscuits, Chips, Cereals, Dairy, Groceries, Beverages)
- Shopping cart functionality
- Checkout with student identification
- Order management for admins
- Coupon code system (IIITMSTUDENT - 10% discount)
- QR code payment integration
- Manual product management system
- Responsive design

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite (development) / MongoDB (production)
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd buddy-market
```

2. Install dependencies:
```bash
npm install
```

3. For local development with SQLite (default):
```bash
npm start
```
The server will run on http://localhost:80

4. For production with MongoDB:

   a. Create a MongoDB Atlas account and get your connection URI
   
   b. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   c. Edit `.env` with your MongoDB credentials:
   ```
   DB_TYPE=mongodb
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/buddymarket
   PORT=80
   ```

## Admin Panel

- URL: http://localhost:80/admin
- Username: admin
- Password: VS1234

## Deployment to Render

### Option 1: Deploy with SQLite (Easiest)

1. Create a GitHub repository and push your code

2. Go to [Render Dashboard](https://dashboard.render.com)

3. Create a new Web Service:
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

### Option 2: Deploy with MongoDB

1. Create a MongoDB Atlas account and cluster

2. Get your MongoDB connection string

3. In Render dashboard, add environment variables:
   - `DB_TYPE`: `mongodb`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `PORT`: `80`

4. Deploy the same way as Option 1

## Project Structure

```
buddy-market/
├── public/
│   ├── index.html      # Main frontend
│   ├── admin.html      # Admin panel
│   ├── logo.png       # Website logo
│   └── uploads/       # Uploaded product images
├── QR/
│   └── QR.jpeg        # Payment QR code
├── server.js          # Main server file
├── package.json        # Dependencies
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore file
└── buddy_market.db    # SQLite database (local)
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Add product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add/update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Admin
- `POST /api/admin/login` - Admin login

## License

MIT License

