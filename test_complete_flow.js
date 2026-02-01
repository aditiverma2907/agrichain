const http = require('http');

function post(path, data, cookie = '') {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json)
      }
    };
    
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      reject(e);
    });
    req.write(json);
    req.end();
  });
}

(async () => {
  try {
    console.log('=== Complete Farmer Flow Test ===\n');
    
    // Step 1: Login
    console.log('Step 1: Login with FARM003/12345678...');
    const loginRes = await post('/api/login', { userId: 'FARM003', password: '12345678' });
    console.log('Status:', loginRes.status);
    
    if (loginRes.status !== 200) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Login successful\n');
    
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
    
    // Step 2: Add Product
    console.log('Step 2: Adding a product...');
    const productId = 'PROD_' + Date.now();
    const addRes = await post('/api/product', {
      productId: productId,
      cropName: 'Wheat',
      area: 5.5,
      quantity: 100,
      unit: 'kg'
    }, cookie);
    console.log('Status:', addRes.status);
    console.log('Response:', addRes.body);
    
    if (addRes.status !== 200) {
      console.log('❌ Add product failed');
      return;
    }
    console.log('✅ Product added successfully\n');
    
    // Step 3: Sell Product
    console.log('Step 3: Selling the product...');
    const sellRes = await post('/api/sell', {
      productId: productId,
      buyerId: null,  // Selling to customer
      price: 50,
      quantity: 50,
      date: new Date().toISOString().split('T')[0]
    }, cookie);
    console.log('Status:', sellRes.status);
    console.log('Response:', sellRes.body);
    
    if (sellRes.status === 200) {
      console.log('✅ Product sold successfully\n');
    } else {
      console.log('❌ Sell failed\n');
    }
    
    console.log('=== Test Complete ===');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
