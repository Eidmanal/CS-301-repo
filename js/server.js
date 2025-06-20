const bcrypt = require('bcrypt');

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'https://krcolgqsxhpsilzzjyig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY29sZ3FzeGhwc2lsenpqeWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzU0MzcsImV4cCI6MjA1Njg1MTQzN30.GKYzect5Zsk0Hh9ocDI_BLygGu6Tk5qIDp1AyJq1Yng';

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'register.html'));
});

// In your login route:
app.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body); 
  const email = req.body.email.trim().toLowerCase();  // Normalize
  const password = req.body.password;

  const { data: users, error } = await supabase
    .from('applicants')
    .select('*')
    .eq('email', email)
    .limit(1);

  console.log('Query users:', users);
  console.log('Query error:', error);

  if (error) {
    return res.status(500).send('Database error: ' + error.message);
  }

  if (users.length === 0) {
    return res.send('<h1>Login failed</h1><p>User not found.</p><a href="/">Try again</a>');
  }

  const user = users[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.send('<h1>Login failed</h1><p>Incorrect password.</p><a href="/">Try again</a>');
  }

  res.redirect('/dashboard.html?loggedin=1');
});


// In your register route:
app.post('/register', async (req, res) => {
  const { full_name, email, phone_number, password } = req.body;
  email = req.body.email.trim().toLowerCase();

  const { data: existing, error: lookupError } = await supabase
    .from('applicants')
    .select('*')
    .eq('email', email);

  if (lookupError) {
    return res.status(500).send('Database error: ' + lookupError.message);
  }

  if (existing.length > 0) {
    return res.send('<h1>User already exists</h1><a href="/register">Try again</a>');
  }

  // Hash password before insert
  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from('applicants')
    .insert([{ full_name, email, phone_number, password: hashedPassword, status: 'pending' }]);

  if (error) {
    return res.status(500).send('Error creating user: ' + error.message);
  }

  res.redirect('/dashboard.html?registered=1');
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
