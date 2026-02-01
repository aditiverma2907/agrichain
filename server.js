const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'agrichain_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Routes

// Login
app.post('/api/login', (req, res) => {
    const { userId, password } = req.body;

    db.query('SELECT * FROM users WHERE user_id = ?', [userId], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid user ID or password' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid user ID or password' });
        }

        req.session.user = {
            user_id: user.user_id,
            name: user.name,
            user_type: user.user_type
        };

        res.json({ 
            message: 'Login successful', 
            user: req.session.user 
        });
    });
});

// Register
app.post('/api/register', async (req, res) => {
    const { userId, name, email, password, userType, phone, address } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            'INSERT INTO users (user_id, name, email, password, user_type, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, name, email, hashedPassword, userType, phone, address],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'User ID or email already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({ message: 'Registration successful' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Get current user
app.get('/api/user', isAuthenticated, (req, res) => {
    res.json(req.session.user);
});

// Get user stock
app.get('/api/stock', isAuthenticated, (req, res) => {
    const userId = req.session.user.user_id;

    db.query(
        `SELECT s.*, p.initial_farmer_id, p.unit 
         FROM stock s 
         JOIN products p ON s.product_id = p.product_id 
         WHERE s.user_id = ?`,
        [userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
        }
    );
});

// Add new product (farmer only)
app.post('/api/product', isAuthenticated, (req, res) => {
    const { productId, cropName, area, quantity, unit } = req.body;
    const userId = req.session.user.user_id;

    if (req.session.user.user_type !== 'farmer') {
        return res.status(403).json({ error: 'Only farmers can add new products' });
    }

    // Insert product
    db.query(
        'INSERT INTO products (product_id, crop_name, initial_farmer_id, current_owner_id, area, unit) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, cropName, userId, userId, area, unit],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Product ID already exists' });
                } else {
                    return res.status(500).json({ error: 'Database error' });
                }
            }

            // Add to stock
            db.query(
                'INSERT INTO stock (user_id, product_id, crop_name, quantity, purchase_date) VALUES (?, ?, ?, ?, CURDATE())',
                [userId, productId, cropName, quantity],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json({ message: 'Product added successfully' });
                }
            );
        }
    );
});

// Sell product
app.post('/api/sell', isAuthenticated, (req, res) => {
    const { productId, buyerId, price, quantity, date } = req.body;
    const sellerId = req.session.user.user_id;

    // Check if seller has the product in stock
    db.query(
        'SELECT * FROM stock WHERE user_id = ? AND product_id = ?',
        [sellerId, productId],
        (err, stockResults) => {
            if (err || stockResults.length === 0) {
                return res.status(400).json({ error: 'Product not in stock' });
            }

            const currentStock = stockResults[0];

            if (currentStock.quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient quantity in stock' });
            }

            const cropName = currentStock.crop_name;

            // If buyer is a customer (no buyerId), mark as sold to customer
            if (!buyerId || buyerId === 'customer') {
                // Record transaction
                db.query(
                    'INSERT INTO transactions (product_id, seller_id, buyer_id, price, quantity, transaction_date, status) VALUES (?, ?, NULL, ?, ?, ?, ?)',
                    [productId, sellerId, price, quantity, date, 'sold_to_customer'],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ error: 'Transaction recording failed' });
                        }

                        // Update seller's stock
                        const newQuantity = currentStock.quantity - quantity;
                        if (newQuantity === 0) {
                            db.query('DELETE FROM stock WHERE stock_id = ?', [currentStock.stock_id], (err) => {
                                if (err) {
                                    return res.status(500).json({ error: 'Stock update failed' });
                                }
                                res.json({ message: 'Sold to customer successfully' });
                            });
                        } else {
                            db.query(
                                'UPDATE stock SET quantity = ? WHERE stock_id = ?',
                                [newQuantity, currentStock.stock_id],
                                (err) => {
                                    if (err) {
                                        return res.status(500).json({ error: 'Stock update failed' });
                                    }
                                    res.json({ message: 'Sold to customer successfully' });
                                }
                            );
                        }
                    }
                );
            } else {
                // Verify buyer exists
                db.query('SELECT * FROM users WHERE user_id = ?', [buyerId], (err, buyerResults) => {
                    if (err || buyerResults.length === 0) {
                        return res.status(400).json({ error: 'Buyer ID not found' });
                    }

                    // Record transaction
                    db.query(
                        'INSERT INTO transactions (product_id, seller_id, buyer_id, price, quantity, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
                        [productId, sellerId, buyerId, price, quantity, date],
                        (err, result) => {
                            if (err) {
                                return res.status(500).json({ error: 'Transaction recording failed' });
                            }

                            // Update product owner
                            db.query(
                                'UPDATE products SET current_owner_id = ? WHERE product_id = ?',
                                [buyerId, productId],
                                (err) => {
                                    if (err) {
                                        return res.status(500).json({ error: 'Owner update failed' });
                                    }

                                    // Update seller's stock
                                    const newQuantity = currentStock.quantity - quantity;
                                    if (newQuantity === 0) {
                                        db.query('DELETE FROM stock WHERE stock_id = ?', [currentStock.stock_id], (err) => {
                                            if (err) {
                                                return res.status(500).json({ error: 'Stock update failed' });
                                            }

                                            // Add to buyer's stock
                                            db.query(
                                                'INSERT INTO stock (user_id, product_id, crop_name, quantity, purchase_price, purchase_date) VALUES (?, ?, ?, ?, ?, ?)',
                                                [buyerId, productId, cropName, quantity, price, date],
                                                (err) => {
                                                    if (err) {
                                                        return res.status(500).json({ error: 'Buyer stock update failed' });
                                                    }
                                                    res.json({ message: 'Product sold successfully' });
                                                }
                                            );
                                        });
                                    } else {
                                        db.query(
                                            'UPDATE stock SET quantity = ? WHERE stock_id = ?',
                                            [newQuantity, currentStock.stock_id],
                                            (err) => {
                                                if (err) {
                                                    return res.status(500).json({ error: 'Stock update failed' });
                                                }

                                                // Add to buyer's stock
                                                db.query(
                                                    'INSERT INTO stock (user_id, product_id, crop_name, quantity, purchase_price, purchase_date) VALUES (?, ?, ?, ?, ?, ?)',
                                                    [buyerId, productId, cropName, quantity, price, date],
                                                    (err) => {
                                                        if (err) {
                                                            return res.status(500).json({ error: 'Buyer stock update failed' });
                                                        }
                                                        res.json({ message: 'Product sold successfully' });
                                                    }
                                                );
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );
                });
            }
        }
    );
});

// Track product by ID (for customers)
app.get('/api/track/:productId', (req, res) => {
    const productId = req.params.productId;

    db.query(
        `SELECT 
            p.product_id,
            p.crop_name,
            p.area,
            p.unit,
            p.created_at,
            u1.name as farmer_name,
            u1.user_id as farmer_id,
            u2.name as current_owner_name,
            u2.user_id as current_owner_id,
            u2.user_type as current_owner_type
         FROM products p
         JOIN users u1 ON p.initial_farmer_id = u1.user_id
         JOIN users u2 ON p.current_owner_id = u2.user_id
         WHERE p.product_id = ?`,
        [productId],
        (err, productResults) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (productResults.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Get transaction history
            db.query(
                `SELECT 
                    t.*,
                    u1.name as seller_name,
                    u1.user_type as seller_type,
                    u2.name as buyer_name,
                    u2.user_type as buyer_type
                 FROM transactions t
                 JOIN users u1 ON t.seller_id = u1.user_id
                 LEFT JOIN users u2 ON t.buyer_id = u2.user_id
                 WHERE t.product_id = ?
                 ORDER BY t.transaction_time ASC`,
                [productId],
                (err, transactionResults) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                        product: productResults[0],
                        transactions: transactionResults
                    });
                }
            );
        }
    );
});

// Get transaction history for logged-in user
app.get('/api/transactions', isAuthenticated, (req, res) => {
    const userId = req.session.user.user_id;

    db.query(
        `SELECT 
            t.*,
            u1.name as seller_name,
            u2.name as buyer_name,
            p.crop_name
         FROM transactions t
         JOIN users u1 ON t.seller_id = u1.user_id
         LEFT JOIN users u2 ON t.buyer_id = u2.user_id
         JOIN products p ON t.product_id = p.product_id
         WHERE t.seller_id = ? OR t.buyer_id = ?
         ORDER BY t.transaction_time DESC`,
        [userId, userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
        }
    );
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/track', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`AgriChain server running on http://localhost:${PORT}`);
});
