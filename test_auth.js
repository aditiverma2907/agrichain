const http = require('http');

function post(path, data) {
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

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', (e) => reject(e));
    req.write(json);
    req.end();
  });
}

(async () => {
  try {
    console.log('Testing login...');
    const loginRes = await post('/api/login', { userId: 'FARM001', password: 'password123' });
    console.log('Login response:', loginRes);

    console.log('Testing register (should fail if user exists)...');
    const regRes = await post('/api/register', {
      userId: 'TEST123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass',
      userType: 'farmer',
      phone: '0000000000',
      address: 'Test Address'
    });
    console.log('Register response:', regRes);
  } catch (err) {
    console.error('Error:', err);
  }
})();
