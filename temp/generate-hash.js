const bcrypt = require('bcryptjs');

// Generate hash for admin password
const adminPassword = 'admin123';
const adminSalt = bcrypt.genSaltSync(10);
const adminHash = bcrypt.hashSync(adminPassword, adminSalt);

// Generate hash for instructor password
const instructorPassword = 'instructor123';
const instructorSalt = bcrypt.genSaltSync(10);
const instructorHash = bcrypt.hashSync(instructorPassword, instructorSalt);

console.log('\n========================================');
console.log('🔐 BCRYPT PASSWORD HASHES');
console.log('========================================\n');
console.log('📧 Admin Account (admin@pact.com)');
console.log('   Password: admin123');
console.log('   Hash: ' + adminHash);
console.log('\n📧 Instructor Account (instructor@pact.com)');
console.log('   Password: instructor123');
console.log('   Hash: ' + instructorHash);
console.log('\n========================================');
console.log('📋 SQL UPDATE COMMANDS');
console.log('========================================\n');

console.log('-- Update admin password hash');
console.log(`UPDATE users SET password_hash = '${adminHash}' WHERE email = 'admin@pact.com';`);
console.log('\n-- Update instructor password hash');
console.log(`UPDATE users SET password_hash = '${instructorHash}' WHERE email = 'instructor@pact.com';`);
console.log('\n-- Or insert new users if they don\'t exist');
console.log(`INSERT INTO users (email, password_hash, full_name, role) VALUES 
  ('admin@pact.com', '${adminHash}', 'System Administrator', 'admin'),
  ('instructor@pact.com', '${instructorHash}', 'Lead Instructor', 'instructor')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;`);
console.log('\n========================================\n');
