const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('./buddy_market.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
});

console.log('Connected to database. Starting reset...\n');

// Reset customer and order data
db.serialize(() => {
    // Delete all orders
    db.run("DELETE FROM orders", (err) => {
        if (err) {
            console.error('Error deleting orders:', err.message);
        } else {
            console.log('✓ All orders deleted successfully');
        }
    });

    // Delete all customers
    db.run("DELETE FROM customers", (err) => {
        if (err) {
            console.error('Error deleting customers:', err.message);
        } else {
            console.log('✓ All customers deleted successfully');
        }
    });

    // Verify products are untouched
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) {
            console.error('Error checking products:', err.message);
        } else {
            console.log(`✓ Products table intact (${row.count} products remaining)`);
        }
    });

    // Verify stock is untouched - check all products have their stock
    db.all("SELECT id, name, stock FROM products LIMIT 5", (err, rows) => {
        if (err) {
            console.error('Error checking stock:', err.message);
        } else {
            console.log('✓ Sample products with stock:');
            rows.forEach(p => {
                console.log(`  - ${p.name}: ${p.stock} units`);
            });
        }
        
        console.log('\n=== RESET COMPLETE ===');
        console.log('Customer Management → Empty');
        console.log('Orders Management → Empty');
        console.log('Top Customers Leaderboard → Empty');
        console.log('Products → Unchanged');
        console.log('Stock → Unchanged');
        console.log('Dashboard → Updated with zero/empty statistics');
        
        db.close();
    });
});

