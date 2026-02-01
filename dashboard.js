let currentUser = null;

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            window.location.href = '/';
            return;
        }
        currentUser = await response.json();
        updateUI();
        // Ensure forms exist and listeners are attached after auth
        ensureForms();
        attachFormListeners();
        loadStock();
        loadTransactions();
    } catch (error) {
        window.location.href = '/';
    }
}

// Ensure Add and Sell forms exist in the DOM (useful if HTML was altered)
function ensureForms() {
    const addTab = document.getElementById('addTab');
    if (addTab && addTab.innerHTML.trim() === '') {
        addTab.innerHTML = `
            <h2>Add New Product</h2>
            <form id="addProductForm" class="dashboard-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="productId">Product ID *</label>
                        <input type="text" id="productId" required placeholder="e.g., PROD001">
                    </div>
                    <div class="form-group">
                        <label for="cropName">Crop Name *</label>
                        <input type="text" id="cropName" required placeholder="e.g., Wheat, Rice">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="area">Area (acres)</label>
                        <input type="number" id="area" step="0.01" placeholder="Enter area">
                    </div>
                    <div class="form-group">
                        <label for="quantity">Quantity *</label>
                        <input type="number" id="quantity" step="0.01" required placeholder="Enter quantity">
                    </div>
                </div>
                <div class="form-group">
                    <label for="unit">Unit</label>
                    <select id="unit">
                        <option value="kg">Kilograms (kg)</option>
                        <option value="ton">Tons</option>
                        <option value="quintal">Quintals</option>
                        <option value="bag">Bags</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Add Product</button>
            </form>
        `;
    }

    const sellForm = document.getElementById('sellForm');
    if (!sellForm) {
        const sellContainer = document.getElementById('sellTab');
        if (sellContainer && sellContainer.innerHTML.trim() === '') {
            sellContainer.innerHTML = `
                <h2>Sell Product</h2>
                <form id="sellForm" class="dashboard-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="sellProductId">Product ID *</label>
                            <input type="text" id="sellProductId" required placeholder="Enter Product ID">
                        </div>
                        <div class="form-group">
                            <label for="sellQuantity">Quantity *</label>
                            <input type="number" id="sellQuantity" step="0.01" required placeholder="Enter quantity">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="sellPrice">Price (per unit) *</label>
                            <input type="number" id="sellPrice" step="0.01" required placeholder="Enter price">
                        </div>
                        <div class="form-group">
                            <label for="sellDate">Sale Date *</label>
                            <input type="date" id="sellDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="sellBuyerId">Buyer ID (leave empty for customer sale)</label>
                        <input type="text" id="sellBuyerId" placeholder="Enter Buyer ID or leave empty">
                        <small>Leave empty if selling to end customer</small>
                    </div>
                    <button type="submit" class="btn btn-primary">Sell Product</button>
                </form>
            `;
        }
    }
}

// Attach form listeners after forms exist in DOM
function attachFormListeners() {
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm && !addProductForm.__bound) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                productId: document.getElementById('productId').value,
                cropName: document.getElementById('cropName').value,
                area: parseFloat(document.getElementById('area').value) || 0,
                quantity: parseFloat(document.getElementById('quantity').value),
                unit: document.getElementById('unit').value
            };
            try {
                const response = await fetch('/api/product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (response.ok) {
                    showMessage('Product added successfully!', 'success');
                    addProductForm.reset();
                    loadStock();
                } else {
                    showMessage(data.error || 'Failed to add product', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
        addProductForm.__bound = true;
    }

    const sellForm = document.getElementById('sellForm');
    if (sellForm && !sellForm.__bound) {
        sellForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                productId: document.getElementById('sellProductId').value,
                buyerId: document.getElementById('sellBuyerId').value || null,
                price: parseFloat(document.getElementById('sellPrice').value),
                quantity: parseFloat(document.getElementById('sellQuantity').value),
                date: document.getElementById('sellDate').value
            };
            try {
                const response = await fetch('/api/sell', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (response.ok) {
                    showMessage('Product sold successfully!', 'success');
                    sellForm.reset();
                    loadStock();
                    loadTransactions();
                    document.getElementById('sellDate').value = new Date().toISOString().split('T')[0];
                } else {
                    showMessage(data.error || 'Failed to sell product', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
        sellForm.__bound = true;
    }
}

// Update UI based on user type
function updateUI() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userType').textContent = currentUser.user_type;
    
    // Hide "Add Product" tab for non-farmers
    if (currentUser.user_type !== 'farmer') {
        const addTab = document.querySelector('[data-tab="add"]');
        if (addTab) {
            addTab.style.display = 'none';
        }
    }
}

// Show message
function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type} show`;
    
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 4000);
}

// Tab switching
function showTab(tabName, btn) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
    });

    // Add active class to selected tab
    const content = document.getElementById(`${tabName}Tab`);
    if (content) content.classList.add('active');

    // Add active class to button: prefer provided element, fallback to data-tab lookup
    if (btn && btn.classList) {
        btn.classList.add('active');
    } else {
        const button = document.querySelector(`[data-tab="${tabName}"]`);
        if (button) button.classList.add('active');
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// Load stock
async function loadStock() {
    try {
        const response = await fetch('/api/stock');
        const stock = await response.json();
        
        const stockList = document.getElementById('stockList');
        
        if (stock.length === 0) {
            stockList.innerHTML = '<div class="empty-state"><p>No stock available</p></div>';
            return;
        }
        
        let html = '<table><thead><tr>';
        html += '<th>Product ID</th>';
        html += '<th>Crop Name</th>';
        html += '<th>Quantity</th>';
        html += '<th>Purchase Price</th>';
        html += '<th>Purchase Date</th>';
        html += '</tr></thead><tbody>';
        
        stock.forEach(item => {
            html += '<tr>';
            html += `<td>${item.product_id}</td>`;
            html += `<td>${item.crop_name}</td>`;
            html += `<td>${item.quantity} ${item.unit || 'kg'}</td>`;
            html += `<td>₹${item.purchase_price || 'N/A'}</td>`;
            html += `<td>${item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        stockList.innerHTML = html;
    } catch (error) {
        showMessage('Error loading stock', 'error');
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        
        const transactionsList = document.getElementById('transactionsList');
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="empty-state"><p>No transactions yet</p></div>';
            return;
        }
        
        let html = '<table><thead><tr>';
        html += '<th>Date</th>';
        html += '<th>Product ID</th>';
        html += '<th>Crop</th>';
        html += '<th>Type</th>';
        html += '<th>Party</th>';
        html += '<th>Quantity</th>';
        html += '<th>Price</th>';
        html += '<th>Total</th>';
        html += '</tr></thead><tbody>';
        
        transactions.forEach(txn => {
            const isSeller = txn.seller_id === currentUser.user_id;
            const type = isSeller ? 'Sold' : 'Purchased';
            const party = isSeller ? (txn.buyer_name || 'Customer') : txn.seller_name;
            
            html += '<tr>';
            html += `<td>${new Date(txn.transaction_date).toLocaleDateString()}</td>`;
            html += `<td>${txn.product_id}</td>`;
            html += `<td>${txn.crop_name}</td>`;
            html += `<td><span class="badge ${isSeller ? 'badge-customer' : 'badge-farmer'}">${type}</span></td>`;
            html += `<td>${party}</td>`;
            html += `<td>${txn.quantity}</td>`;
            html += `<td>₹${txn.price}</td>`;
            html += `<td>₹${(txn.price * txn.quantity).toFixed(2)}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        transactionsList.innerHTML = html;
    } catch (error) {
        showMessage('Error loading transactions', 'error');
    }
}

// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sellDate').value = today;
    
    // Add product form handler (farmers only)
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                productId: document.getElementById('productId').value,
                cropName: document.getElementById('cropName').value,
                area: parseFloat(document.getElementById('area').value) || 0,
                quantity: parseFloat(document.getElementById('quantity').value),
                unit: document.getElementById('unit').value
            };
            
            try {
                const response = await fetch('/api/product', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Product added successfully!', 'success');
                    addProductForm.reset();
                    loadStock();
                } else {
                    showMessage(data.error || 'Failed to add product', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }
    
    // Sell product form handler
    const sellForm = document.getElementById('sellForm');
    if (sellForm) {
        sellForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                productId: document.getElementById('sellProductId').value,
                buyerId: document.getElementById('sellBuyerId').value || null,
                price: parseFloat(document.getElementById('sellPrice').value),
                quantity: parseFloat(document.getElementById('sellQuantity').value),
                date: document.getElementById('sellDate').value
            };
            
            try {
                const response = await fetch('/api/sell', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Product sold successfully!', 'success');
                    sellForm.reset();
                    loadStock();
                    loadTransactions();
                    
                    // Set today's date again
                    document.getElementById('sellDate').value = new Date().toISOString().split('T')[0];
                } else {
                    showMessage(data.error || 'Failed to sell product', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }
});
