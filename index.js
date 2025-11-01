const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { testConnection } = require('./utils/database');

// Load configuration from config.json
const config = require('./config.json');

// Debug: Check if config is loaded
console.log('📁 Configuration loaded from config.json');
console.log(`   - TOKEN: ${config.token ? '✅ Set' : '❌ Missing'}`);
console.log(`   - CLIENT_ID: ${config.clientId ? '✅ Set' : '❌ Missing'}`);
console.log(`   - SUPABASE_URL: ${config.supabaseUrl ? '✅ Set' : '❌ Missing'}`);

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent, // Required for reading message content (prefix commands)
    ]
});

// Initialize command collection
client.commands = new Collection();

// Load handlers
const handlersPath = path.join(__dirname, 'handlers');
const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

for (const file of handlerFiles) {
    const handler = require(`./handlers/${file}`);
    handler(client);
}

// Test database connection and login
(async () => {
    try {
        console.log('🔄 Testing database connection...');
        try {
            await testConnection();
        } catch (dbError) {
            console.warn('⚠️  Database connection failed, but bot will continue...');
            console.warn('   Some features may not work until database is accessible.');
        }

        // Check if token exists
        if (!config.token) {
            console.error('❌ ERROR: Discord bot token is missing!');
            console.error('Please set the "token" field in config.json');
            process.exit(1);
        }

        // Debug: Show token info (first/last 10 chars only for security)
        const token = config.token;
        console.log(`🔑 Token detected: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`);

        // Login to Discord with better error handling
        console.log('🔄 Logging in to Discord...');
        console.log('⏳ Attempting connection to Discord Gateway...');

        // Add event listeners for debugging
        client.on('debug', (info) => {
            if (info.includes('Preparing to connect') || info.includes('Identifying') || info.includes('Ready')) {
                console.log(`[DEBUG] ${info}`);
            }
        });

        client.on('error', (error) => {
            console.error('❌ Discord Client Error:', error);
        });

        client.on('warn', (warning) => {
            console.warn('⚠️  Discord Client Warning:', warning);
        });

        // Create a timeout for login (30 seconds)
        const loginPromise = client.login(config.token);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Connection timeout: Unable to connect to Discord Gateway after 30 seconds.\nYour hosting provider (SparkedHost) may be blocking WebSocket connections to Discord.'));
            }, 30000);
        });

        // Race between login and timeout
        await Promise.race([loginPromise, timeoutPromise]);

    } catch (error) {
        console.error('❌ Failed to start bot:', error.message);

        if (error.message.includes('TOKEN_INVALID')) {
            console.error('\n⚠️  SOLUTION: Your bot token is invalid!');
            console.error('   1. Go to https://discord.com/developers/applications');
            console.error('   2. Select your bot');
            console.error('   3. Go to "Bot" section');
            console.error('   4. Click "Reset Token" to get a new token');
            console.error('   5. Update config.json with the new token\n');
        } else if (error.message.includes('Privileged intent')) {
            console.error('\n⚠️  SOLUTION: Enable these intents in Discord Developer Portal:');
            console.error('   1. Go to https://discord.com/developers/applications');
            console.error('   2. Select your bot');
            console.error('   3. Go to "Bot" section');
            console.error('   4. Enable "Server Members Intent" and "Message Content Intent"');
            console.error('   5. Save and restart the bot\n');
        } else if (error.message.includes('timeout') || error.message.includes('Gateway') || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            console.error('\n⚠️  SOLUTION: Your hosting provider is blocking Discord connections!');
            console.error('   ');
            console.error('   🚫 SparkedHost/Pterodactyl is blocking WebSocket connections to Discord');
            console.error('   ');
            console.error('   ✅ SOLUTIONS:');
            console.error('   1. Contact SparkedHost support and ask them to:');
            console.error('      - Allow WebSocket connections to discord.com');
            console.error('      - Whitelist gateway.discord.gg');
            console.error('      - Enable outbound connections on ports 443 and 80');
            console.error('   ');
            console.error('   2. OR switch to a different hosting provider that supports Discord bots:');
            console.error('      - Railway.app (recommended)');
            console.error('      - Heroku');
            console.error('      - DigitalOcean');
            console.error('      - AWS/Google Cloud');
            console.error('      - Your own VPS');
            console.error('   ');
            console.error('   3. OR run the bot on your local PC (works perfectly as you mentioned)\n');
        } else {
            console.error('Full error:', error);
        }

        process.exit(1);
    }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

