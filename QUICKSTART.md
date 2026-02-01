# AgriChain - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install MySQL (if not installed)
- **Windows**: Download from https://dev.mysql.com/downloads/installer/
- **Mac**: `brew install mysql`
- **Linux**: `sudo apt install mysql-server`

### 2. Setup Database
Open terminal and run:
```bash
mysql -u root -p < database.sql
```
Enter your MySQL password when prompted.

### 3. Configure .env File
Edit the `.env` file and update:
```
DB_PASSWORD=your_mysql_password
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Application
```bash
npm start
```

### 6. Open in Browser
Visit: **http://localhost:3000**

## 🎯 Test the System

### Login with Demo Account
- **User ID**: FARM001
- **Password**: password123

### Try These Features:
1. **Add a Product** (Farmers only)
   - Product ID: WHEAT001
   - Crop: Wheat
   - Quantity: 100 kg

2. **Sell the Product**
   - Select "Sell Product" tab
   - Enter Product ID: WHEAT001
   - Enter Buyer ID: RET001
   - Set price and quantity

3. **Track Product**
   - Go to Track page
   - Enter Product ID: WHEAT001
   - View complete journey!

## 📝 Quick Commands

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Access MySQL
mysql -u root -p agrichain
```

## 🆘 Common Issues

**Can't connect to MySQL?**
- Check if MySQL is running: `mysql --version`
- Verify password in `.env` file

**Port 3000 in use?**
- Change PORT in `.env` to 3001 or any available port

**Dependencies not installing?**
- Try: `npm cache clean --force`
- Then: `npm install`

## 📱 User Types & Capabilities

| User Type      | Can Add Products | Can Buy | Can Sell |
|----------------|------------------|---------|----------|
| Farmer         | ✅               | ❌      | ✅       |
| Retailer       | ❌               | ✅      | ✅       |
| Superstockist  | ❌               | ✅      | ✅       |
| Distributor    | ❌               | ✅      | ✅       |
| Customer       | View tracking only (no login needed) |

## 🎨 Features to Explore

1. **Dashboard** - View your stock and transactions
2. **Add Product** - Create new agricultural products
3. **Sell Product** - Transfer products to buyers
4. **Track Product** - See complete supply chain
5. **Transaction History** - View all your deals

## 💡 Tips

- Product IDs must be unique
- Always verify buyer ID exists before selling
- Leave buyer ID empty when selling to end customers
- Stock updates automatically on successful transactions

---

**Need help?** Check the full README.md file for detailed documentation!
