import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/users',
  headers: { 'Content-Type': 'application/json' }
});

async function test() {
  try {
    console.log('Logging in...');
    // Login as teacher
    const loginRes = await api.post('/auth', {
      email: 'teacher@test.com', // guess email, or try to register
      password: 'password123'
    });
    
    // We need real credentials. Let's just create a new teacher.
    console.log('Login success', loginRes.data);
  } catch (err) {
    console.error('Login failed, trying to register...');
    try {
      const regRes = await api.post('/', {
        name: 'Test Teacher',
        email: 'teacher123@test.com',
        password: 'password123',
        role: 'teacher'
      });
      console.log('Register success', regRes.data);
    } catch (e) {
      console.error('Register failed', e.response?.data || e.message);
    }
  }
}

test();
