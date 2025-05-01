const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Fetch admin user from database
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !adminUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password with hashed password in database
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to verify admin JWT token
const authenticateAdmin = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Add organization and generate license keys
router.post('/organizations', authenticateAdmin, async (req, res) => {
  try {
    const { name, licenseCount, adminUsername, adminPassword } = req.body;

    // Validate input
    if (!name || !licenseCount || !adminUsername || !adminPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Start a transaction
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();

    if (orgError) {
      return res.status(400).json({ error: 'Failed to create organization', details: orgError });
    }

    // Hash the educational admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create educational admin
    const { error: adminError } = await supabase
      .from('educational_admins')
      .insert({
        organization_id: organization.id,
        username: adminUsername,
        password: hashedPassword
      });

    if (adminError) {
      // Roll back organization creation if admin creation fails
      await supabase.from('organizations').delete().eq('id', organization.id);
      return res.status(400).json({ error: 'Failed to create educational admin', details: adminError });
    }

    // Generate license keys
    const licenseKeys = [];
    for (let i = 0; i < licenseCount; i++) {
      // Call the Postgres function to generate a license key
      const { data: keyData, error: keyGenError } = await supabase.rpc('generate_license_key');
      
      if (keyGenError) {
        console.error('Error generating license key:', keyGenError);
        continue;
      }
      
      licenseKeys.push({
        organization_id: organization.id,
        license_key: keyData
      });
    }

    // Insert license keys
    const { error: licenseError } = await supabase
      .from('license_keys')
      .insert(licenseKeys);

    if (licenseError) {
      console.error('Error inserting license keys:', licenseError);
      // We'll still return success as the organization and admin were created
    }

    res.status(201).json({
      message: 'Organization created successfully',
      organization,
      licenseCount: licenseKeys.length
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all organizations
router.get('/organizations', authenticateAdmin, async (req, res) => {
  try {
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch organizations', details: error });
    }

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add license keys to an existing organization
router.post('/organizations/:id/license-keys', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { licenseCount } = req.body;

    if (!licenseCount || licenseCount < 1) {
      return res.status(400).json({ error: 'Valid license count is required' });
    }

    // Check if organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Generate license keys
    const licenseKeys = [];
    for (let i = 0; i < licenseCount; i++) {
      // Call the Postgres function to generate a license key
      const { data: keyData, error: keyGenError } = await supabase.rpc('generate_license_key');
      
      if (keyGenError) {
        console.error('Error generating license key:', keyGenError);
        continue;
      }
      
      licenseKeys.push({
        organization_id: id,
        license_key: keyData
      });
    }

    // Insert license keys
    const { error: licenseError } = await supabase
      .from('license_keys')
      .insert(licenseKeys);

    if (licenseError) {
      return res.status(400).json({ error: 'Failed to add license keys', details: licenseError });
    }

    res.json({
      message: `${licenseKeys.length} license keys added successfully`,
      organization: organization.name
    });
  } catch (error) {
    console.error('Error adding license keys:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete an organization and all related data
router.delete('/organizations/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Delete the organization (will cascade delete license keys and educational admin)
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(400).json({ error: 'Failed to delete organization', details: deleteError });
    }

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 