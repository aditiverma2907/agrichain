// Show message
function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type} show`;
    
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 4000);
}

// Get user type badge HTML
function getUserTypeBadge(userType) {
    return `<span class="badge badge-${userType}">${userType}</span>`;
}

// Track product
async function trackProduct() {
    const productId = document.getElementById('trackProductId').value.trim();
    
    if (!productId) {
        showMessage('Please enter a product ID', 'error');
        return;
    }
    
    const resultDiv = document.getElementById('trackingResult');
    resultDiv.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
    
    try {
        const response = await fetch(`/api/track/${productId}`);
        
        if (!response.ok) {
            const data = await response.json();
            resultDiv.innerHTML = `<div class="empty-state"><p>${data.error || 'Product not found'}</p></div>`;
            showMessage(data.error || 'Product not found', 'error');
            return;
        }
        
        const data = await response.json();
        displayTrackingResult(data);
    } catch (error) {
        resultDiv.innerHTML = '<div class="empty-state"><p>Error tracking product</p></div>';
        showMessage('Network error. Please try again.', 'error');
    }
}

// Display tracking result
function displayTrackingResult(data) {
    const resultDiv = document.getElementById('trackingResult');
    const { product, transactions } = data;
    
    let html = '<div class="product-info">';
    html += '<h3>Product Information</h3>';
    html += '<div class="info-grid">';
    html += `<div class="info-item"><strong>Product ID</strong><span>${product.product_id}</span></div>`;
    html += `<div class="info-item"><strong>Crop Name</strong><span>${product.crop_name}</span></div>`;
    html += `<div class="info-item"><strong>Area</strong><span>${product.area || 'N/A'} acres</span></div>`;
    html += `<div class="info-item"><strong>Unit</strong><span>${product.unit}</span></div>`;
    html += `<div class="info-item"><strong>Original Farmer</strong><span>${product.farmer_name} ${getUserTypeBadge('farmer')}</span></div>`;
    html += `<div class="info-item"><strong>Current Owner</strong><span>${product.current_owner_name} ${getUserTypeBadge(product.current_owner_type)}</span></div>`;
    html += `<div class="info-item"><strong>Created On</strong><span>${new Date(product.created_at).toLocaleDateString()}</span></div>`;
    html += '</div>';
    html += '</div>';
    
    html += '<div class="transaction-chain">';
    html += '<h3>Supply Chain Journey</h3>';
    
    if (transactions.length === 0) {
        html += '<div class="empty-state"><p>No transactions yet. Product is still with the farmer.</p></div>';
    } else {
        transactions.forEach((txn, index) => {
            html += '<div class="chain-item">';
            html += '<div class="chain-header">';
            html += `<div class="chain-step">Step ${index + 1}</div>`;
            html += `<div class="chain-date">${new Date(txn.transaction_date).toLocaleDateString()}</div>`;
            html += '</div>';
            html += '<div class="chain-details">';
            
            if (txn.status === 'sold_to_customer') {
                html += `<p><strong>Seller:</strong> ${txn.seller_name} ${getUserTypeBadge(txn.seller_type)}</p>`;
                html += `<p><strong>Buyer:</strong> End Customer ${getUserTypeBadge('customer')}</p>`;
            } else {
                html += `<p><strong>From:</strong> ${txn.seller_name} ${getUserTypeBadge(txn.seller_type)}</p>`;
                html += `<p><strong>To:</strong> ${txn.buyer_name} ${getUserTypeBadge(txn.buyer_type)}</p>`;
            }
            
            html += `<p><strong>Quantity:</strong> ${txn.quantity} ${product.unit}</p>`;
            html += `<p><strong>Price:</strong> ₹${txn.price} per ${product.unit}</p>`;
            html += `<p><strong>Total Value:</strong> ₹${(txn.price * txn.quantity).toFixed(2)}</p>`;
            html += '</div>';
            html += '</div>';
        });
    }
    
    html += '</div>';
    
    resultDiv.innerHTML = html;
}

// Allow tracking with Enter key
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trackProductId').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            trackProduct();
        }
    });
});
