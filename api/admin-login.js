const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug output
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key exists:', !!supabaseServiceKey);
console.log('JWT Secret exists:', !!process.env.JWT_SECRET);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body));
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Fetch admin user from database
    console.log('Fetching admin user for username:', username);
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    console.log('Supabase response:', adminUser ? 'User found' : 'User not found', error ? `Error: ${error.message}` : 'No error');

    if (error || !adminUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password with hashed password in database
    console.log('Comparing passwords');
    const isMatch = await bcrypt.compare(password, adminUser.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    console.log('Generating JWT token');
    const token = jwt.sign(
      { id: adminUser.id, username: adminUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Send token to client
    res.json({
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username
      }
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}; 