const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ Ready! Logged in as ${client.user.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} servers`);
        
        // Set bot status
        client.user.setPresence({
            activities: [{ name: 'Quantum Labs', type: ActivityType.Playing }],
            status: 'online',
        });
    },
};

