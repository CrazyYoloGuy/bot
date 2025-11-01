const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Hardcoded guild ID, welcome channel, auto-role, and log channel
            const TARGET_GUILD_ID = '1416057641515618409';
            const WELCOME_CHANNEL_ID = '1424842001307668723';
            const AUTO_ROLE_ID = '1424841889777189005';
            const LOG_CHANNEL_ID = '1424842100608073810';

            // Only run for the specific guild
            if (member.guild.id !== TARGET_GUILD_ID) {
                return;
            }

            // Send simple welcome message
            try {
                const welcomeChannel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
                if (welcomeChannel) {
                    await welcomeChannel.send(`Welcome ${member} to **${member.guild.name}**! 👋`);
                    console.log(`[WELCOME] Welcomed ${member.user.tag} to ${member.guild.name}`);
                }
            } catch (error) {
                console.error('[WELCOME] Error sending welcome message:', error);
            }

            // Give auto-role
            let roleAssigned = false;
            let roleName = 'Unknown';
            try {
                const autoRole = await member.guild.roles.fetch(AUTO_ROLE_ID).catch(() => null);
                if (autoRole) {
                    await member.roles.add(autoRole);
                    roleAssigned = true;
                    roleName = autoRole.name;
                    console.log(`[WELCOME] Gave ${member.user.tag} the ${autoRole.name} role`);
                }
            } catch (error) {
                console.error('[WELCOME] Error giving auto-role:', error);
            }

            // Log to log channel
            try {
                const logChannel = await member.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
                if (logChannel) {
                    const logMessage = roleAssigned
                        ? `✅ ${member.user.tag} joined the server and was given the **${roleName}** role.`
                        : `⚠️ ${member.user.tag} joined the server but failed to receive the auto-role.`;

                    await logChannel.send(logMessage);
                    console.log(`[WELCOME] Logged join for ${member.user.tag}`);
                }
            } catch (error) {
                console.error('[WELCOME] Error logging to log channel:', error);
            }

        } catch (error) {
            console.error('[WELCOME] Error in guildMemberAdd:', error);
        }
    },
};

