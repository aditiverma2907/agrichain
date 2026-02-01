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
      console.error('Request error details:', e);
      reject(e);
    });
    req.write(json);
    req.end();
  });
}

(async () => {
  try {
    console.log('Step 1: Testing login with FARM003/12345678...');
    const loginRes = await post('/api/login', { userId: 'FARM003', password: '12345678' });
    console.log('Login Status:', loginRes.status);
    console.log('Login Response:', loginRes.body);
    
    if (loginRes.status !== 200) {
      console.log('❌ Login failed. Check credentials.');
      return;
    }
    
    const setCookie = loginRes.headers['set-cookie'];
    if (!setCookie) {
      console.log('❌ No session cookie received');
      return;
    }
    
    const cookie = setCookie[0].split(';')[0];
    console.log('✅ Login successful, session established\n');
    
    console.log('Step 2: Adding a product...');
    const productRes = await post('/api/product', {
      productId: 'PROD_TEST_' + Date.now(),
      cropName: 'Wheat',
      area: 5.5,
      quantity: 100,
      unit: 'kg'
    }, cookie);
    
    console.log('Add Product Status:', productRes.status);
    console.log('Add Product Response:', productRes.body);
    
    if (productRes.status === 200) {
      console.log('\n✅ SUCCESS: Product added successfully!');
    } else {
      console.log('\n❌ ERROR: Failed to add product');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
