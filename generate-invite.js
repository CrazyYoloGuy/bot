const config = require('./config.json');

const clientId = config.clientId;

if (!clientId) {
    console.error('❌ CLIENT_ID not found in config.json!');
    process.exit(1);
}

// Administrator permissions (8) - includes everything
const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;

// Alternative with specific permissions
const specificPermsUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=1099511627830&scope=bot%20applications.commands`;

console.log('\n🔗 Bot Invite Links:');
console.log('━'.repeat(80));
console.log('\n✨ RECOMMENDED (Administrator - All Permissions):');
console.log(inviteUrl);
console.log('\n📝 Alternative (Specific Permissions):');
console.log(specificPermsUrl);
console.log('\n━'.repeat(80));

console.log('\n📋 Instructions:');
console.log('1. Copy one of the links above (use the first one for easiest setup)');
console.log('2. Open it in your browser');
console.log('3. Select your server from the dropdown');
console.log('4. Click "Authorize"');
console.log('5. Complete the captcha');
console.log('6. Wait for "Authorized" confirmation');

console.log('\n⚠️  IMPORTANT - Enable Intents in Developer Portal:');
console.log('   1. Go to: https://discord.com/developers/applications');
console.log('   2. Select your application');
console.log('   3. Go to Bot → Privileged Gateway Intents');
console.log('   4. ✅ Enable "SERVER MEMBERS INTENT"');
console.log('   5. Click "Save Changes"');

console.log('\n🔄 After inviting the bot:');
console.log('   1. Run: npm run deploy');
console.log('   2. Run: npm start');
console.log('   3. Type / in Discord to see commands\n');

