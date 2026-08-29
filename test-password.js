const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const storedPassword = (process.env.DASHBOARD_PASSWORD || '').trim();
console.log('═══════════════════════════════════════════════════');
console.log('🔑 PASSWORD TEST');
console.log('═══════════════════════════════════════════════════');
console.log('📝 Stored password length:', storedPassword.length);
console.log('📝 Stored password characters:', storedPassword.split('').map((c, i) => `[${i}]: "${c}" (${c.charCodeAt(0)})`).join('\n'));
console.log('📝 Full password:', storedPassword);
console.log('═══════════════════════════════════════════════════');

// Test the password you're trying to use
const testPassword = 'V1_!mQ2#rL_khmoviehub_npro_9@xP4$kN8zT_2005';
console.log('📝 Test password length:', testPassword.length);
console.log('📝 Test password characters:', testPassword.split('').map((c, i) => `[${i}]: "${c}" (${c.charCodeAt(0)})`).join('\n'));
console.log('📝 Full test password:', testPassword);
console.log('═══════════════════════════════════════════════════');

const match = storedPassword === testPassword;
console.log('✅ Password match:', match);

if (!match) {
    console.log('❌ Passwords do NOT match!');
    console.log('Here are the differences:');
    for (let i = 0; i < Math.max(storedPassword.length, testPassword.length); i++) {
        const storedChar = storedPassword[i] || '(missing)';
        const testChar = testPassword[i] || '(missing)';
        if (storedChar !== testChar) {
            console.log(`   Position ${i}: "${storedChar}" vs "${testChar}"`);
        }
    }
}
console.log('═══════════════════════════════════════════════════');