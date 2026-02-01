# AgriChain - Project Structure & Flow

## 📁 File Organization

```
agrichain/
│
├── 📄 server.js              ← Main backend server (Express + MySQL)
├── 📄 database.sql           ← Database schema and sample data
├── 📄 package.json           ← Node.js dependencies
├── 📄 .env                   ← Configuration (DB credentials)
├── 📄 .gitignore            ← Git ignore rules
├── 📄 README.md             ← Complete documentation
├── 📄 QUICKSTART.md         ← Quick setup guide
│
└── 📁 public/               ← Frontend files (HTML, CSS, JS)
    ├── 📄 login.html        ← Login/Register page
    ├── 📄 dashboard.html    ← User dashboard
    ├── 📄 track.html        ← Product tracking
    ├── 📄 styles.css        ← All styling
    ├── 📄 login.js          ← Login/Register logic
    ├── 📄 dashboard.js      ← Dashboard functionality
    └── 📄 track.js          ← Tracking logic
```

## 🔄 System Flow

### 1. User Registration Flow
```
User fills form → Frontend validates → POST /api/register
                                           ↓
                                   Backend validates
                                           ↓
                                   Hash password (bcrypt)
                                           ↓
                                   Insert into users table
                                           ↓
                                   Success → Redirect to login
```

### 2. Login Flow
```
User enters credentials → POST /api/login
                              ↓
                    Check user in database
                              ↓
                    Verify password (bcrypt)
                              ↓
                    Create session
                              ↓
                    Redirect to dashboard
```

### 3. Farmer Adds Product Flow
```
Farmer Dashboard → Add Product Form → POST /api/product
                                           ↓
                                  Insert into products table
                                           ↓
                                  Insert into stock table
                                           ↓
                                  Farmer's stock updated
```

### 4. Selling Product Flow
```
Seller Dashboard → Sell Form → POST /api/sell
                                    ↓
                        Verify product in stock
                                    ↓
                        Check buyer exists
                                    ↓
                        Start Transaction:
                        ├─ Insert into transactions
                        ├─ Update product owner
                        ├─ Reduce seller's stock
                        └─ Add to buyer's stock
                                    ↓
                        Success → Update both dashboards
```

### 5. Product Tracking Flow
```
Customer → Track page → Enter Product ID → GET /api/track/:id
                                                ↓
                                    Get product details
                                                ↓
                                    Get all transactions
                                                ↓
                                    Display supply chain journey
```

## 🗄️ Database Tables

### users
- user_id (Primary Key)
- name
- email
- password (hashed)
- user_type (farmer/retailer/superstockist/distributor)
- phone
- address
- created_at

### products
- product_id (Primary Key)
- crop_name
- initial_farmer_id (Foreign Key → users)
- current_owner_id (Foreign Key → users)
- area
- unit
- created_at

### stock
- stock_id (Primary Key)
- user_id (Foreign Key → users)
- product_id (Foreign Key → products)
- crop_name
- quantity
- purchase_price
- purchase_date

### transactions
- transaction_id (Primary Key)
- product_id (Foreign Key → products)
- seller_id (Foreign Key → users)
- buyer_id (Foreign Key → users, NULL for customer)
- price
- quantity
- transaction_date
- status (completed/sold_to_customer)
- transaction_time

## 🎯 API Endpoints Summary

### Authentication
| Method | Endpoint          | Description           | Auth Required |
|--------|-------------------|-----------------------|---------------|
| POST   | /api/register     | Register new user     | No            |
| POST   | /api/login        | User login            | No            |
| POST   | /api/logout       | User logout           | Yes           |
| GET    | /api/user         | Get current user      | Yes           |

### Products & Stock
| Method | Endpoint          | Description           | Auth Required |
|--------|-------------------|-----------------------|---------------|
| POST   | /api/product      | Add product (farmer)  | Yes           |
| GET    | /api/stock        | Get user's stock      | Yes           |
| POST   | /api/sell         | Sell product          | Yes           |

### Tracking
| Method | Endpoint              | Description           | Auth Required |
|--------|-----------------------|-----------------------|---------------|
| GET    | /api/track/:productId | Track product         | No            |
| GET    | /api/transactions     | User's transactions   | Yes           |

## 🔐 Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **Session Management**: express-session with secure cookies
3. **Input Validation**: Both frontend and backend
4. **SQL Injection Prevention**: Parameterized queries
5. **Authentication Middleware**: Protected routes
6. **Role-Based Access**: Different permissions per user type

## 💾 Technology Stack Details

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **mysql2**: MySQL driver
- **bcrypt**: Password hashing
- **express-session**: Session management
- **dotenv**: Environment variables

### Frontend
- **HTML5**: Structure
- **CSS3**: Styling with gradients, animations
- **Vanilla JavaScript**: No frameworks needed
- **Fetch API**: HTTP requests

### Database
- **MySQL**: Relational database
- **Foreign Keys**: Data integrity
- **Transactions**: ACID properties
- **Indexing**: Performance optimization

## 🎨 UI/UX Features

1. **Responsive Design**: Works on all devices
2. **Color-Coded Badges**: Easy user type identification
3. **Smooth Animations**: Professional feel
4. **Form Validation**: Immediate feedback
5. **Loading States**: User knows what's happening
6. **Success/Error Messages**: Clear communication

## 📊 Sample User Journey

### Farmer (FARM001)
1. Login
2. Add product: WHEAT001 (Wheat, 100kg)
3. View in stock
4. Sell 50kg to RET001 at ₹30/kg
5. View transaction history

### Retailer (RET001)
1. Login
2. See WHEAT001 (50kg) in stock
3. Sell 30kg to SUPER001 at ₹35/kg
4. View updated stock (20kg remaining)

### Superstockist (SUPER001)
1. Login
2. See WHEAT001 (30kg) in stock
3. Sell 30kg to customer at ₹40/kg
4. Stock now empty

### Customer (No Login)
1. Go to Track page
2. Enter WHEAT001
3. See complete journey:
   - Original: FARM001 → Created
   - Step 1: FARM001 → RET001 (₹30/kg)
   - Step 2: RET001 → SUPER001 (₹35/kg)
   - Step 3: SUPER001 → Customer (₹40/kg)

## 🚀 Performance Considerations

1. **Database Indexing**: Primary keys and foreign keys
2. **Session Storage**: In-memory for fast access
3. **Connection Pooling**: MySQL connection reuse
4. **Minimal Dependencies**: Fast load times
5. **Static Files**: Served efficiently by Express

## 🔧 Customization Options

You can easily customize:
- User types (add more categories)
- Product attributes (add certification, quality grade)
- Transaction details (add delivery status)
- UI colors (change gradient colors in CSS)
- Units (add more measurement units)

---

**This structure ensures scalability, security, and maintainability!**
