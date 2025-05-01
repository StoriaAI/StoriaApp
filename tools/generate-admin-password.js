/**
 * A simple tool to generate a bcrypt hash for an admin password
 * 
 * Usage: 
 * 1. Run with node: node tools/generate-admin-password.js
 * 2. Enter a password when prompted
 * 3. Copy the resulting hash for use in the SQL command to create an admin user
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the password to hash: ', async (password) => {
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('\nBcrypt hashed password:');
    console.log(hashedPassword);
    
    console.log('\nUse this SQL to create an admin user:');
    console.log(`INSERT INTO admin_users (username, password) VALUES ('your_admin_username', '${hashedPassword}');`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
  
  rl.close();
}); 