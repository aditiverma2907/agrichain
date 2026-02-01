-- AgriChain Database Schema

CREATE DATABASE IF NOT EXISTS agrichain;
USE agrichain;

-- Users table for all stakeholders
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('farmer', 'retailer', 'superstockist', 'distributor') NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    initial_farmer_id VARCHAR(50) NOT NULL,
    current_owner_id VARCHAR(50) NOT NULL,
    area DECIMAL(10,2),
    unit VARCHAR(20) DEFAULT 'kg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (initial_farmer_id) REFERENCES users(user_id),
    FOREIGN KEY (current_owner_id) REFERENCES users(user_id)
);

-- Transactions table
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    seller_id VARCHAR(50) NOT NULL,
    buyer_id VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'sold_to_customer') DEFAULT 'completed',
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id)
);

-- Stock table
CREATE TABLE stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    purchase_price DECIMAL(10,2),
    purchase_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Insert sample users
INSERT INTO users (user_id, name, email, password, user_type, phone, address) VALUES
('FARM001', 'Ravi Kumar', 'ravi@farmer.com', '$2b$10$8K1p/A0dL1H3K9BZVzCv2.9Z1sKz1X0jzJxF0qKvZxQxF5l5x5x5x', 'farmer', '9876543210', 'Village Rampur, District Meerut'),
('RET001', 'Suresh Traders', 'suresh@retail.com', '$2b$10$8K1p/A0dL1H3K9BZVzCv2.9Z1sKz1X0jzJxF0qKvZxQxF5l5x5x5x', 'retailer', '9876543211', 'Market Road, Meerut'),
('SUPER001', 'Agri SuperStock Pvt Ltd', 'super@agristock.com', '$2b$10$8K1p/A0dL1H3K9BZVzCv2.9Z1sKz1X0jzJxF0qKvZxQxF5l5x5x5x', 'superstockist', '9876543212', 'Industrial Area, Delhi');

-- Note: Default password for all users is 'password123'
