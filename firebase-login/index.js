const http = require('http');
const admin = require('./firebaseConfig');
const { parse } = require('querystring');

// Inisialisasi Firestore
const db = admin.firestore();

// Fungsi untuk menangani pendaftaran pengguna (register)
async function registerUser(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', async () => {
    const { email, password, name } = parse(body);

    try {
      // Membuat pengguna baru di Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email,
        password,
      });

      // Menyimpan informasi tambahan pengguna di Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email: email,
        name: name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User registered successfully', userId: userRecord.uid }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

// Fungsi untuk menangani login pengguna
async function loginUser(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', async () => {
    const { email } = parse(body);

    try {
      // Mendapatkan pengguna dari Firebase Authentication
      const user = await admin.auth().getUserByEmail(email);

      // Mengambil data pengguna dari Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User logged in successfully', user: userDoc.data() }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User data not found in Firestore' }));
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

// Membuat server HTTP
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/register') {
    registerUser(req, res);
  } else if (req.method === 'POST' && req.url === '/login') {
    loginUser(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Menentukan port server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
