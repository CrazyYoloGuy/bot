const { Events, EmbedBuilder, MessageFlags } = require('discord.js');
const os = require('os');

// Import all interaction handlers
const ticketHandler = require('./handlers/ticket-handler');
const reactionRolesHandler = require('./handlers/reactionroles-handler');
const legitHandler = require('./handlers/legit-handler');
const applicationHandler = require('./handlers/application-handler');
const aboutusHandler = require('./handlers/aboutus-handler');
const whoHandler = require('./handlers/who-handler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);

                const errorMessage = {
                    content: '❌ There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
            return; // Exit after handling command
        }

        // Delegate to specialized handlers
        try {
            // Try ticket handler
            if (interaction.customId?.includes('ticket') ||
                interaction.customId?.includes('close') ||
                interaction.customId?.includes('claim') ||
                interaction.customId?.includes('feedback') ||
                interaction.customId?.includes('view_my_tickets')) {
                await ticketHandler.execute(interaction, client);
                return;
            }

            // Try reaction roles handler
            if (interaction.customId?.startsWith('role_')) {
                await reactionRolesHandler.execute(interaction, client);
                return;
            }

            // Try legit handler
            if (interaction.customId?.startsWith('legit_')) {
                await legitHandler.execute(interaction, client);
                return;
            }

            // Try application handler
            if (interaction.customId?.startsWith('apply_')) {
                await applicationHandler.execute(interaction, client);
                return;
            }

            // Try aboutus handler
            if (interaction.customId?.startsWith('aboutus_')) {
                await aboutusHandler.execute(interaction, client);
                return;
            }

            // Try who handler
            if (interaction.customId?.startsWith('who_')) {
                await whoHandler.execute(interaction, client);
                return;
            }
        } catch (error) {
            console.error('Error in delegated handler:', error);
        }

        // Handle button interactions (for built-in buttons like ping, stats, etc.)
        if (interaction.isButton()) {
            const { customId } = interaction;

            // Refresh Stats Button
            if (customId === 'refresh_stats') {
                const uptime = process.uptime();
                const days = Math.floor(uptime / 86400);
                const hours = Math.floor(uptime / 3600) % 24;
                const minutes = Math.floor(uptime / 60) % 60;
                const seconds = Math.floor(uptime % 60);
                const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🔄 Stats Refreshed!')
                    .addFields(
                        { name: '⏱️ Uptime', value: uptimeString, inline: true },
                        { name: '📡 Ping', value: `${client.ws.ping}ms`, inline: true },
                        { name: '💾 Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Ping Test Button
            else if (customId === 'ping_test') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const latency = Date.now() - interaction.createdTimestamp;

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📡 Ping Test Results')
                    .addFields(
                        { name: '🏓 Roundtrip Latency', value: `${latency}ms`, inline: true },
                        { name: '💓 WebSocket Ping', value: `${client.ws.ping}ms`, inline: true },
                        { name: '📊 Status', value: latency < 200 ? '✅ Excellent' : latency < 500 ? '⚠️ Good' : '❌ Poor', inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

            // System Info Button
            else if (customId === 'system_info') {
                const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
                const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
                const usedMemory = (totalMemory - freeMemory).toFixed(2);
                const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(1);

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('💻 Detailed System Information')
                    .addFields(
                        { name: '🖥️ Platform', value: `${os.platform()} (${os.arch()})`, inline: true },
                        { name: '⚙️ CPU Cores', value: `${os.cpus().length}`, inline: true },
                        { name: '📦 Node.js', value: process.version, inline: true },
                        { name: '💾 Total RAM', value: `${totalMemory} GB`, inline: true },
                        { name: '🆓 Free RAM', value: `${freeMemory} GB`, inline: true },
                        { name: '📊 RAM Usage', value: `${memoryPercent}%`, inline: true },
                        { name: '🔧 CPU Model', value: os.cpus()[0].model, inline: false }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Command List Button
            else if (customId === 'command_list') {
                const commands = client.commands;
                const categories = {};

                // Group commands by category
                commands.forEach(cmd => {
                    const category = cmd.data.name.includes('kick') || cmd.data.name.includes('clear') ? 'Moderation' :
                                   cmd.data.name.includes('8ball') ? 'Fun' : 'Utility';

                    if (!categories[category]) categories[category] = [];
                    categories[category].push(`\`/${cmd.data.name}\` - ${cmd.data.description}`);
                });

                const embed = new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('📝 Available Commands')
                    .setDescription(`Total Commands: **${commands.size}**`);

                for (const [category, cmds] of Object.entries(categories)) {
                    embed.addFields({ name: `${category}`, value: cmds.join('\n'), inline: false });
                }

                embed.setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Performance Details Button
            else if (customId === 'performance_details') {
                const uptime = process.uptime();
                const days = Math.floor(uptime / 86400);
                const hours = Math.floor(uptime / 3600) % 24;
                const minutes = Math.floor(uptime / 60) % 60;
                const seconds = Math.floor(uptime % 60);

                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('📈 Detailed Performance Metrics')
                    .addFields(
                        { name: '⏱️ Uptime Breakdown', value: `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`, inline: false },
                        { name: '💾 Heap Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`, inline: true },
                        { name: '📊 External Memory', value: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`, inline: true },
                        { name: '🔢 Array Buffers', value: `${(process.memoryUsage().arrayBuffers / 1024 / 1024).toFixed(2)} MB`, inline: true },
                        { name: '💓 Average Ping', value: `${client.ws.ping}ms`, inline: true },
                        { name: '🔄 Process ID', value: `${process.pid}`, inline: true },
                        { name: '⚙️ Platform', value: `${process.platform}`, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }
    },
};

