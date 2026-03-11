require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

const app = express();
const PORT = process.env.PORT || 80;

// Determine database type
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let db;
let mongoClient;
let mongoDb;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/logo', express.static(path.join(__dirname, 'LOGO')));
app.use('/qr', express.static(path.join(__dirname, 'QR')));

// Initialize Database based on type
async function initializeDatabase() {
    if (DB_TYPE === 'mongodb') {
        // MongoDB Connection
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buddymarket';
        mongoClient = new MongoClient(mongoUri);
        
        try {
            await mongoClient.connect();
            mongoDb = mongoClient.db();
            console.log('Connected to MongoDB');
            
            // Create collections if they don't exist
            await mongoDb.createCollection('products');
            await mongoDb.createCollection('customers');
            await mongoDb.createCollection('orders');
            await mongoDb.createCollection('admin');
            await mongoDb.createCollection('product_management');
            
            // Insert default admin if not exists
            const adminCount = await mongoDb.collection('admin').countDocuments();
            if (adminCount === 0) {
                await mongoDb.collection('admin').insertOne({
                    username: 'admin',
                    password: 'VS1234'
                });
            }
            
            // Insert sample products if none exist
            const productCount = await mongoDb.collection('products').countDocuments();
            if (productCount === 0) {
                const products = [
                    { name: 'Parle-G - 500g', price: 35, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Parle-G Gluco Biscuits - 500g pack', stock: 50, inStock: true },
                    { name: 'Parle Krackjack - 500g', price: 45, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Parle Krackjack Biscuits - 500g', stock: 50, inStock: true },
                    { name: 'Britannia Good Day - 500g', price: 50, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Britannia Good Day Cookies - 500g', stock: 50, inStock: true },
                    { name: 'Britannia Bourbon - 300g', price: 40, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Britannia Bourbon Biscuits - 300g', stock: 50, inStock: true },
                    { name: 'Sunfeast Dark Fantasy - 300g', price: 55, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Sunfeast Dark Fantasy - 300g', stock: 50, inStock: true },
                    { name: 'Unibic Choco Chip - 200g', price: 45, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Unibic Choco Chip Cookies - 200g', stock: 50, inStock: true },
                    { name: 'Bourbon Biscuits - 300g', price: 35, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Bourbon Biscuits - 300g', stock: 50, inStock: true },
                    { name: 'Hide & Seek - 200g', price: 40, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Hide & Seek Cookies - 200g', stock: 50, inStock: true },
                    { name: 'Oreo Original - 300g', price: 50, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Oreo Original Cookies - 300g', stock: 50, inStock: true },
                    { name: 'Milano Cookies - 300g', price: 60, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Milano Cookies - 300g', stock: 50, inStock: true },
                    { name: 'Lay\'s Classic - 150g', price: 30, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Lay\'s Classic Salted Chips - 150g', stock: 50, inStock: true },
                    { name: 'Lay\'s Magic Masala - 150g', price: 35, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Lay\'s Magic Masala - 150g', stock: 50, inStock: true },
                    { name: 'Doritos Nacho Cheese - 150g', price: 80, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Doritos Nacho Cheese - 150g', stock: 50, inStock: true },
                    { name: 'Cheetos - 150g', price: 45, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Cheetos Cheese Balls - 150g', stock: 50, inStock: true },
                    { name: 'Kellogg\'s Corn Flakes - 500g', price: 180, image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=200', category: 'Cereals', description: 'Kellogg\'s Corn Flakes - 500g', stock: 30, inStock: true },
                    { name: 'Kellogg\'s Chocos - 250g', price: 150, image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=200', category: 'Cereals', description: 'Kellogg\'s Chocos - 250g', stock: 30, inStock: true },
                    { name: 'Quaker Oats - 500g', price: 120, image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=200', category: 'Cereals', description: 'Quaker Oats - 500g', stock: 30, inStock: true },
                    { name: 'Amul Butter - 500g', price: 260, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Butter - 500g', stock: 20, inStock: true },
                    { name: 'Amul Cheese - 200g', price: 140, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Cheese Slices - 200g', stock: 25, inStock: true },
                    { name: 'Amul Fresh Cream - 1L', price: 90, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Fresh Cream - 1L', stock: 20, inStock: true },
                    { name: 'Mother Dairy Milk - 500ml', price: 45, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Mother Dairy Milk - 500ml', stock: 40, inStock: true },
                    { name: 'Amul Taaza Toned Milk - 1L', price: 55, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Taaza Toned Milk - 1L', stock: 40, inStock: true },
                    { name: 'Tata Salt - 1kg', price: 25, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200', category: 'Groceries', description: 'Tata Rock Salt - 1kg', stock: 50, inStock: true },
                    { name: 'Fortune Oil - 1L', price: 160, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', category: 'Groceries', description: 'Fortune Soyabean Oil - 1L', stock: 25, inStock: true },
                    { name: 'Basmati Rice - 1kg', price: 150, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200', category: 'Groceries', description: 'Premium Basmati Rice - 1kg', stock: 30, inStock: true },
                    { name: 'Tata Tea - 250g', price: 70, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Tata Tea Premium - 250g', stock: 40, inStock: true },
                    { name: 'Bru Instant Coffee - 100g', price: 95, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Bru Instant Coffee - 100g', stock: 30, inStock: true },
                    { name: 'Nescafe Classic - 100g', price: 180, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Nescafe Classic Coffee - 100g', stock: 25, inStock: true },
                    { name: 'Horlicks - 500g', price: 280, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Horlicks Health Drink - 500g', stock: 20, inStock: true },
                    { name: 'Boost - 500g', price: 290, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Boost Energy Drink - 500g', stock: 25, inStock: true }
                ];
                await mongoDb.collection('products').insertMany(products);
            }
            
            // Insert sample customers if none exist
            const customerCount = await mongoDb.collection('customers').countDocuments();
            if (customerCount === 0) {
                const customers = [
                    { name: 'Rajesh Kumar', phone: '9876543210', roomNumber: '101', totalOrders: 15, totalSpent: 4500 },
                    { name: 'Priya Sharma', phone: '9876543211', roomNumber: '205', totalOrders: 12, totalSpent: 3800 },
                    { name: 'Amit Patel', phone: '9876543212', roomNumber: '308', totalOrders: 10, totalSpent: 3200 },
                    { name: 'Sneha Gupta', phone: '9876543213', roomNumber: '410', totalOrders: 8, totalSpent: 2800 },
                    { name: 'Vikram Singh', phone: '9876543214', roomNumber: '512', totalOrders: 7, totalSpent: 2400 }
                ];
                await mongoDb.collection('customers').insertMany(customers);
            }
            
        } catch (err) {
            console.error('MongoDB connection error:', err);
            // Fall back to SQLite if MongoDB fails
            initializeSQLite();
        }
    } else {
        // SQLite (default for local development)
        initializeSQLite();
    }
}

function initializeSQLite() {
    db = new sqlite3.Database('./buddy_market.db');
    
    db.serialize(() => {
        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            category TEXT,
            description TEXT,
            stock INTEGER DEFAULT 0,
            inStock INTEGER DEFAULT 1
        )`);

        // Customers Table
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            roomNumber TEXT,
            hostelName TEXT,
            studentId TEXT,
            totalOrders INTEGER DEFAULT 0,
            totalSpent REAL DEFAULT 0,
            UNIQUE(phone, roomNumber)
        )`);

        // Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customerId INTEGER,
            customerName TEXT,
            customerPhone TEXT,
            customerAddress TEXT,
            hostelName TEXT,
            studentId TEXT,
            items TEXT,
            subtotal REAL,
            discount REAL DEFAULT 0,
            total REAL,
            deliveryOption TEXT,
            paymentOption TEXT,
            couponApplied INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Pending',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customerId) REFERENCES customers(id)
        )`);

        // Admin Table
        db.run(`CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        // Product Management Table
        db.run(`CREATE TABLE IF NOT EXISTS product_management (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemName TEXT,
            pricePerPiece REAL DEFAULT 0,
            numberOfPieces INTEGER DEFAULT 0,
            total REAL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insert default admin
        db.get("SELECT * FROM admin WHERE username = 'admin'", (err, row) => {
            if (!row) {
                db.run("INSERT INTO admin (username, password) VALUES ('admin', 'VS1234')");
            }
        });

        // Insert sample products
        db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (row.count === 0) {
                const products = [
                    { name: 'Parle-G - 500g', price: 35, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Parle-G Gluco Biscuits - 500g pack', stock: 50 },
                    { name: 'Parle Krackjack - 500g', price: 45, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Parle Krackjack Biscuits - 500g', stock: 50 },
                    { name: 'Britannia Good Day - 500g', price: 50, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Britannia Good Day Cookies - 500g', stock: 50 },
                    { name: 'Britannia Bourbon - 300g', price: 40, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Britannia Bourbon Biscuits - 300g', stock: 50 },
                    { name: 'Sunfeast Dark Fantasy - 300g', price: 55, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Sunfeast Dark Fantasy - 300g', stock: 50 },
                    { name: 'Unibic Choco Chip - 200g', price: 45, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Unibic Choco Chip Cookies - 200g', stock: 50 },
                    { name: 'Bourbon Biscuits - 300g', price: 35, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Bourbon Biscuits - 300g', stock: 50 },
                    { name: 'Hide & Seek - 200g', price: 40, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Hide & Seek Cookies - 200g', stock: 50 },
                    { name: 'Oreo Original - 300g', price: 50, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Oreo Original Cookies - 300g', stock: 50 },
                    { name: 'Milano Cookies - 300g', price: 60, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', category: 'Biscuits', description: 'Milano Cookies - 300g', stock: 50 },
                    { name: 'Lay\'s Classic - 150g', price: 30, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Lay\'s Classic Salted Chips - 150g', stock: 50 },
                    { name: 'Lay\'s Magic Masala - 150g', price: 35, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Lay\'s Magic Masala - 150g', stock: 50 },
                    { name: 'Doritos Nacho Cheese - 150g', price: 80, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Doritos Nacho Cheese - 150g', stock: 50 },
                    { name: 'Cheetos - 150g', price: 45, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', category: 'Chips', description: 'Cheetos Cheese Balls - 150g', stock: 50 },
                    { name: 'Kellogg\'s Corn Flakes - 500g', price: 180, image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=200', category: 'Cereals', description: 'Kellogg\'s Corn Flakes - 500g', stock: 30 },
                    { name: 'Kellogg\'s Chocos - 250g', price: 150, image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=200', category: 'Cereals', description: 'Kellogg\'s Chocos - 250g', stock: 30 },
                    { name: 'Quaker Oats - 500g', price: 120, image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=200', category: 'Cereals', description: 'Quaker Oats - 500g', stock: 30 },
                    { name: 'Amul Butter - 500g', price: 260, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Butter - 500g', stock: 20 },
                    { name: 'Amul Cheese - 200g', price: 140, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Cheese Slices - 200g', stock: 25 },
                    { name: 'Amul Fresh Cream - 1L', price: 90, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Fresh Cream - 1L', stock: 20 },
                    { name: 'Mother Dairy Milk - 500ml', price: 45, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Mother Dairy Milk - 500ml', stock: 40 },
                    { name: 'Amul Taaza Toned Milk - 1L', price: 55, image: 'https://images.unsplash.com/photo-1560089000-f5d5287d3bab?w=200', category: 'Dairy', description: 'Amul Taaza Toned Milk - 1L', stock: 40 },
                    { name: 'Tata Salt - 1kg', price: 25, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200', category: 'Groceries', description: 'Tata Rock Salt - 1kg', stock: 50 },
                    { name: 'Fortune Oil - 1L', price: 160, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', category: 'Groceries', description: 'Fortune Soyabean Oil - 1L', stock: 25 },
                    { name: 'Basmati Rice - 1kg', price: 150, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200', category: 'Groceries', description: 'Premium Basmati Rice - 1kg', stock: 30 },
                    { name: 'Tata Tea - 250g', price: 70, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Tata Tea Premium - 250g', stock: 40 },
                    { name: 'Bru Instant Coffee - 100g', price: 95, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Bru Instant Coffee - 100g', stock: 30 },
                    { name: 'Nescafe Classic - 100g', price: 180, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Nescafe Classic Coffee - 100g', stock: 25 },
                    { name: 'Horlicks - 500g', price: 280, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Horlicks Health Drink - 500g', stock: 20 },
                    { name: 'Boost - 500g', price: 290, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', category: 'Beverages', description: 'Boost Energy Drink - 500g', stock: 25 }
                ];
                
                const stmt = db.prepare("INSERT INTO products (name, price, image, category, description, stock) VALUES (?, ?, ?, ?, ?, ?)");
                products.forEach(p => stmt.run(p.name, p.price, p.image, p.category, p.description, p.stock));
                stmt.finalize();
                
                const customers = [
                    { name: 'Rajesh Kumar', phone: '9876543210', roomNumber: '101', totalOrders: 15, totalSpent: 4500 },
                    { name: 'Priya Sharma', phone: '9876543211', roomNumber: '205', totalOrders: 12, totalSpent: 3800 },
                    { name: 'Amit Patel', phone: '9876543212', roomNumber: '308', totalOrders: 10, totalSpent: 3200 },
                    { name: 'Sneha Gupta', phone: '9876543213', roomNumber: '410', totalOrders: 8, totalSpent: 2800 },
                    { name: 'Vikram Singh', phone: '9876543214', roomNumber: '512', totalOrders: 7, totalSpent: 2400 }
                ];
                
                const custStmt = db.prepare("INSERT INTO customers (name, phone, roomNumber, totalOrders, totalSpent) VALUES (?, ?, ?, ?, ?)");
                customers.forEach(c => custStmt.run(c.name, c.phone, c.roomNumber, c.totalOrders, c.totalSpent));
                custStmt.finalize();
            }
        });
        
        console.log('SQLite database initialized');
    });
}

// ============== API Routes ==============

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const products = await mongoDb.collection('products').find({}).sort({ _id: -1 }).toArray();
            products.forEach(p => { p.id = p._id; });
            res.json(products);
        } else {
            db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const product = await mongoDb.collection('products').findOne({ _id: new ObjectId(req.params.id) });
            if (product) product.id = product._id;
            res.json(product);
        } else {
            db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(row);
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add product
app.post('/api/products', upload.single('image'), async (req, res) => {
    const { name, price, description, stock, category } = req.body;
    const priceVal = parseFloat(price) || 0;
    const stockVal = parseInt(stock) || 0;
    const categoryVal = category || 'General';
    
    let image = '';
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }
    
    const inStockVal = stockVal > 0;
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const result = await mongoDb.collection('products').insertOne({
                name, price: priceVal, image, category: categoryVal, description: description || '', stock: stockVal, inStock: inStockVal
            });
            res.json({ id: result.insertedId, message: 'Product added successfully', image });
        } else {
            db.run("INSERT INTO products (name, price, image, category, description, stock, inStock) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                [name, priceVal, image, categoryVal, description || '', stockVal, inStockVal ? 1 : 0], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, message: 'Product added successfully', image });
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { name, price, description, stock, category, existingImage } = req.body;
    const priceVal = parseFloat(price) || 0;
    const stockVal = parseInt(stock) || 0;
    const categoryVal = category || 'General';
    
    let image = existingImage || '';
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }
    
    const inStockVal = stockVal > 0;
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('products').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { name, price: priceVal, image, category: categoryVal, description: description || '', stock: stockVal, inStock: inStockVal } }
            );
            res.json({ message: 'Product updated successfully', image });
        } else {
            db.run("UPDATE products SET name = ?, price = ?, image = ?, category = ?, description = ?, stock = ?, inStock = ? WHERE id = ?", 
                [name, priceVal, image, categoryVal, description || '', stockVal, inStockVal ? 1 : 0, req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Product updated successfully', image });
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
        } else {
            db.run("DELETE FROM products WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
            });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const customers = await mongoDb.collection('customers').find({}).sort({ totalSpent: -1 }).toArray();
            customers.forEach(c => { c.id = c._id; });
            res.json(customers);
        } else {
            db.all("SELECT * FROM customers ORDER BY totalSpent DESC", [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset customer stats
app.post('/api/customers/reset-stats', async (req, res) => {
    const { id } = req.body;
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('customers').updateOne(
                { _id: new ObjectId(id) },
                { $set: { totalOrders: 0, totalSpent: 0 } }
            );
        } else {
            db.run("UPDATE customers SET totalOrders = 0, totalSpent = 0 WHERE id = ?", [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
            });
        }
        res.json({ message: 'Customer stats reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('customers').deleteOne({ _id: new ObjectId(req.params.id) });
        } else {
            db.run("DELETE FROM customers WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
            });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer by phone and room
app.get('/api/customers/:phone/:roomNumber', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const customer = await mongoDb.collection('customers').findOne({ 
                phone: req.params.phone, roomNumber: req.params.roomNumber 
            });
            if (customer) customer.id = customer._id;
            res.json(customer);
        } else {
            db.get("SELECT * FROM customers WHERE phone = ? AND roomNumber = ?", 
                [req.params.phone, req.params.roomNumber], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(row);
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add or update customer
app.post('/api/customers', async (req, res) => {
    const { name, phone, roomNumber, hostelName, studentId } = req.body;
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            let customer = await mongoDb.collection('customers').findOne({ phone, roomNumber });
            
            if (customer) {
                const updateFields = {};
                if (name && name !== customer.name) updateFields.name = name;
                if (hostelName) updateFields.hostelName = hostelName;
                if (studentId) updateFields.studentId = studentId;
                
                if (Object.keys(updateFields).length > 0) {
                    await mongoDb.collection('customers').updateOne(
                        { _id: customer._id },
                        { $set: updateFields }
                    );
                    customer = await mongoDb.collection('customers').findOne({ _id: customer._id });
                }
                customer.id = customer._id;
                res.json({ message: 'Customer found', customer, existing: true });
            } else {
                const result = await mongoDb.collection('customers').insertOne({
                    name, phone, roomNumber, hostelName: hostelName || '', studentId: studentId || '', totalOrders: 0, totalSpent: 0
                });
                res.json({ id: result.insertedId, message: 'Customer added successfully', existing: false });
            }
        } else {
            db.get("SELECT * FROM customers WHERE phone = ? AND roomNumber = ?", [phone, roomNumber], (err, row) => {
                if (row) {
                    if (name && name !== row.name) {
                        db.run("UPDATE customers SET name = ? WHERE id = ?", [name, row.id]);
                    }
                    if (hostelName) {
                        db.run("UPDATE customers SET hostelName = ? WHERE id = ?", [hostelName, row.id]);
                    }
                    if (studentId) {
                        db.run("UPDATE customers SET studentId = ? WHERE id = ?", [studentId, row.id]);
                    }
                    res.json({ message: 'Customer found', customer: row, existing: true });
                } else {
                    db.run("INSERT INTO customers (name, phone, roomNumber, hostelName, studentId) VALUES (?, ?, ?, ?, ?)", 
                        [name, phone, roomNumber, hostelName || '', studentId || ''], function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ id: this.lastID, message: 'Customer added successfully', existing: false });
                    });
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create order
app.post('/api/orders', async (req, res) => {
    const { customerId, customerName, customerPhone, customerAddress, hostelName, studentId, items, total, subtotal, discount, deliveryOption, paymentOption, couponApplied } = req.body;
    const itemsJson = JSON.stringify(items);
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            // Stock validation
            for (const item of items) {
                const product = await mongoDb.collection('products').findOne({ _id: new ObjectId(item.id.toString()) });
                if (!product) {
                    return res.status(400).json({ error: `${item.name}: Product not found` });
                }
                if (product.stock < item.quantity) {
                    return res.status(400).json({ error: `${item.name}: Only ${product.stock} items available in stock` });
                }
            }
            
            // Create order
            const orderDoc = {
                customerId: new ObjectId(customerId.toString()),
                customerName, customerPhone, customerAddress, hostelName, studentId,
                items, subtotal, discount: discount || 0, total, deliveryOption, paymentOption,
                couponApplied: couponApplied ? 1 : 0, status: 'Pending', createdAt: new Date()
            };
            
            const result = await mongoDb.collection('orders').insertOne(orderDoc);
            const orderId = result.insertedId;
            
            // Deduct stock
            for (const item of items) {
                await mongoDb.collection('products').updateOne(
                    { _id: new ObjectId(item.id.toString()) },
                    { $inc: { stock: -item.quantity }, $set: { inStock: true } }
                );
            }
            
            res.json({ id: orderId, message: 'Order placed successfully' });
        } else {
            let stockErrors = [];
            let checkCount = 0;
            
            items.forEach(item => {
                db.get("SELECT stock FROM products WHERE id = ?", [item.id], (err, row) => {
                    checkCount++;
                    if (err || !row) {
                        stockErrors.push(`${item.name}: Product not found`);
                    } else if (row.stock < item.quantity) {
                        stockErrors.push(`${item.name}: Only ${row.stock} items available in stock`);
                    }
                    
                    if (checkCount === items.length) {
                        if (stockErrors.length > 0) {
                            return res.status(400).json({ error: stockErrors.join(', ') });
                        }
                        
                        db.run("INSERT INTO orders (customerId, customerName, customerPhone, customerAddress, hostelName, studentId, items, subtotal, discount, total, deliveryOption, paymentOption, couponApplied, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')", 
                            [customerId, customerName, customerPhone, customerAddress, hostelName, studentId, itemsJson, subtotal, discount || 0, total, deliveryOption, paymentOption, couponApplied ? 1 : 0], function(err) {
                            if (err) return res.status(500).json({ error: err.message });
                            
                            const orderId = this.lastID;
                            
                            items.forEach(item => {
                                db.run("UPDATE products SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END, inStock = CASE WHEN CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END > 0 THEN 1 ELSE 0 END WHERE id = ?", 
                                    [item.quantity, item.quantity, item.quantity, item.quantity, item.id]);
                            });
                            
                            res.json({ id: orderId, message: 'Order placed successfully' });
                        });
                    }
                });
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const orders = await mongoDb.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
            orders.forEach(o => { 
                o.id = o._id; 
                if (typeof o.items === 'string') o.items = JSON.parse(o.items);
            });
            res.json(orders);
        } else {
            db.all("SELECT * FROM orders ORDER BY createdAt DESC", [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                rows.forEach(row => { row.items = JSON.parse(row.items); });
                res.json(rows);
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const order = await mongoDb.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
            if (order) {
                order.id = order._id;
                if (typeof order.items === 'string') order.items = JSON.parse(order.items);
            }
            res.json(order);
        } else {
            db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                if (row) row.items = JSON.parse(row.items);
                res.json(row);
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status
app.put('/api/orders/:id', async (req, res) => {
    const { status } = req.body;
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const order = await mongoDb.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
            if (!order) return res.status(404).json({ error: 'Order not found' });
            if (order.status === 'Delivered') return res.status(400).json({ error: 'Cannot modify a delivered order' });
            
            const oldStatus = order.status;
            
            // Handle stock restoration for cancellation
            if (status === 'Cancelled' && (oldStatus === 'Pending' || oldStatus === 'Confirmed')) {
                for (const item of order.items) {
                    await mongoDb.collection('products').updateOne(
                        { _id: new ObjectId(item.id.toString()) },
                        { $inc: { stock: item.quantity } }
                    );
                }
            }
            
            // Update customer stats on delivery
            if (status === 'Delivered' && oldStatus === 'Confirmed') {
                await mongoDb.collection('customers').updateOne(
                    { _id: order.customerId },
                    { $inc: { totalOrders: 1, totalSpent: order.total } }
                );
            }
            
            await mongoDb.collection('orders').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { status } }
            );
            
            res.json({ message: 'Order status updated' });
        } else {
            db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, order) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!order) return res.status(404).json({ error: 'Order not found' });
                if (order.status === 'Delivered') return res.status(400).json({ error: 'Cannot modify a delivered order' });
                
                const oldStatus = order.status;
                const orderItems = JSON.parse(order.items);
                
                if (status === 'Cancelled' && (oldStatus === 'Pending' || oldStatus === 'Confirmed')) {
                    orderItems.forEach(item => {
                        db.run("UPDATE products SET stock = stock + ?, inStock = CASE WHEN stock + ? > 0 THEN 1 ELSE 0 END WHERE id = ?", 
                            [item.quantity, item.quantity, item.id]);
                    });
                }
                
                if (status === 'Delivered' && oldStatus === 'Confirmed') {
                    db.run("UPDATE customers SET totalOrders = totalOrders + 1, totalSpent = totalSpent + ? WHERE id = ?",
                        [order.total, order.customerId]);
                }
                
                db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Order status updated' });
                });
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('orders').deleteOne({ _id: new ObjectId(req.params.id) });
        } else {
            db.run("DELETE FROM orders WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
            });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const admin = await mongoDb.collection('admin').findOne({ username, password });
            if (admin) {
                res.json({ success: true, message: 'Login successful' });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            db.get("SELECT * FROM admin WHERE username = ? AND password = ?", [username, password], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                if (row) {
                    res.json({ success: true, message: 'Login successful' });
                } else {
                    res.status(401).json({ success: false, message: 'Invalid credentials' });
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// QR Code
app.get('/api/qr-code', (req, res) => {
    const qrPath = path.join(__dirname, 'QR', 'QR.jpeg');
    fs.readFile(qrPath, (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'QR code not found' });
        }
        const base64 = data.toString('base64');
        res.json({ qrCode: 'data:image/jpeg;base64,' + base64 });
    });
});

// Product Management API
app.get('/api/product-management', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const records = await mongoDb.collection('product_management').find({}).toArray();
            records.forEach(r => { r.id = r._id; });
            res.json(records);
        } else {
            db.all("SELECT * FROM product_management ORDER BY id ASC", [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/product-management', async (req, res) => {
    const { itemName, pricePerPiece, numberOfPieces, total } = req.body;
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            const result = await mongoDb.collection('product_management').insertOne({
                itemName: itemName || '', pricePerPiece: pricePerPiece || 0, numberOfPieces: numberOfPieces || 0, total: total || 0, createdAt: new Date()
            });
            res.json({ id: result.insertedId, message: 'Record added successfully' });
        } else {
            db.run("INSERT INTO product_management (itemName, pricePerPiece, numberOfPieces, total) VALUES (?, ?, ?, ?)", 
                [itemName || '', pricePerPiece || 0, numberOfPieces || 0, total || 0], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, message: 'Record added successfully' });
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/product-management/:id', async (req, res) => {
    const { itemName, pricePerPiece, numberOfPieces, total } = req.body;
    
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('product_management').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { itemName: itemName || '', pricePerPiece: pricePerPiece || 0, numberOfPieces: numberOfPieces || 0, total: total || 0 } }
            );
        } else {
            db.run("UPDATE product_management SET itemName = ?, pricePerPiece = ?, numberOfPieces = ?, total = ? WHERE id = ?", 
                [itemName || '', pricePerPiece || 0, numberOfPieces || 0, total || 0, req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
            });
        }
        res.json({ message: 'Record updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/product-management/:id', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('product_management').deleteOne({ _id: new ObjectId(req.params.id) });
        } else {
            db.run("DELETE FROM product_management WHERE id = ?", [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
            });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/product-management', async (req, res) => {
    try {
        if (DB_TYPE === 'mongodb' && mongoDb) {
            await mongoDb.collection('product_management').deleteMany({});
        } else {
            db.run("DELETE FROM product_management", function(err) {
                if (err) return res.status(500).json({ error: err.message });
            });
        }
        res.json({ message: 'All records cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Buddy Market server running on port ${PORT} (${DB_TYPE})`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});


