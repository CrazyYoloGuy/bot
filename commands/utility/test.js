const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags
} = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Display detailed bot information with interactive Components v2'),
    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Calculate uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Calculate memory usage
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedMemory = (totalMemory - freeMemory).toFixed(2);
        const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(1);

        // Get bot stats
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;
        const commandCount = client.commands.size;

        // Create Components v2 Container with text and buttons mixed throughout
        const components = [
            new ContainerBuilder()
                // Header Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# 🤖 ${client.user.username} Dashboard`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`Welcome to the **Interactive Bot Control Panel**! Explore different sections using the buttons below.`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )

                // Bot Statistics Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 📊 Bot Statistics`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Servers:** ${totalGuilds} | **Users:** ${totalUsers.toLocaleString()} | **Channels:** ${totalChannels} | **Commands:** ${commandCount}`
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('Refresh Stats')
                                .setEmoji({ name: '🔄' })
                                .setCustomId('refresh_stats'),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Success)
                                .setLabel('Ping Test')
                                .setEmoji({ name: '📡' })
                                .setCustomId('ping_test')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )

                // Performance Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ⚡ Performance Metrics`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Uptime:** ${uptimeString}\n**Memory Usage:** ${memoryUsage} MB\n**WebSocket Ping:** ${client.ws.ping}ms\n**Node.js Version:** ${process.version}`
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('View Performance Details')
                                .setEmoji({ name: '📈' })
                                .setCustomId('performance_details')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )

                // System Information Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 💻 System Information`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Platform:** ${os.platform()} (${os.arch()})\n**CPU Cores:** ${os.cpus().length}\n**Total RAM:** ${totalMemory} GB | **Free RAM:** ${freeMemory} GB\n**RAM Usage:** ${memoryPercent}%`
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('System Details')
                                .setEmoji({ name: '💻' })
                                .setCustomId('system_info'),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('View Commands')
                                .setEmoji({ name: '📝' })
                                .setCustomId('command_list')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )

                // Library Information Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 📚 Library & Links`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Discord.js:** v${require('discord.js').version} | **Bot Version:** 1.0.0 | **Developer:** Quantum Labs`
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel('Documentation')
                                .setEmoji({ name: '📖' })
                                .setURL('https://discord.js.org/'),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel('Invite Bot')
                                .setEmoji({ name: '🔗' })
                                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel('Support Server')
                                .setEmoji({ name: '💬' })
                                .setURL('https://discord.gg/discord-developers')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )

                // Footer
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*Requested by ${interaction.user.tag} • Using Discord Components v2*`)
                )
        ];

        // Send message with Components v2 flags
        await interaction.reply({
            components: components,
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            ephemeral: true
        });
    },
};

