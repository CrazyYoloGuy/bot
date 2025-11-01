const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-emoji')
        .setDescription('Create an emoji from the server icon (Owner only)')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Name for the emoji (optional, defaults to server name)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check if user has required role
            const REQUIRED_ROLE_ID = '1424847975842054395';
            if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
                return await interaction.editReply({
                    content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.'
                });
            }

            // Check if user is the server owner
            if (interaction.user.id !== interaction.guild.ownerId) {
                return await interaction.editReply({
                    content: '❌ **Access Denied!**\n\nThis command can only be used by the **server owner**.'
                });
            }

            // Check if server has an icon
            if (!interaction.guild.icon) {
                return await interaction.editReply({
                    content: '❌ **No Server Icon!**\n\nThis server doesn\'t have an icon set. Please add a server icon first.'
                });
            }

            // Check bot permissions
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
                return await interaction.editReply({
                    content: '❌ **Missing Permissions!**\n\nI need the **Manage Expressions** permission to create emojis.'
                });
            }

            // Get emoji name from option or use server name
            let emojiName = interaction.options.getString('name');
            
            if (!emojiName) {
                // Use server name, clean it for emoji naming
                emojiName = interaction.guild.name
                    .replace(/[^a-zA-Z0-9_]/g, '_') // Replace invalid chars with underscore
                    .replace(/_+/g, '_') // Replace multiple underscores with single
                    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
                    .substring(0, 32); // Discord emoji name limit
            } else {
                // Clean provided name
                emojiName = emojiName
                    .replace(/[^a-zA-Z0-9_]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
                    .substring(0, 32);
            }

            // Validate emoji name
            if (!emojiName || emojiName.length < 2) {
                return await interaction.editReply({
                    content: '❌ **Invalid Emoji Name!**\n\nEmoji name must be at least 2 characters long and contain only letters, numbers, and underscores.'
                });
            }

            // Get server icon URL (PNG format, 256x256)
            const iconURL = interaction.guild.iconURL({ extension: 'png', size: 256 });

            console.log(`[SERVER-EMOJI] ${interaction.user.tag} is creating emoji from server icon`);
            console.log(`[SERVER-EMOJI] Icon URL: ${iconURL}`);
            console.log(`[SERVER-EMOJI] Emoji Name: ${emojiName}`);

            // Create the emoji
            const emoji = await interaction.guild.emojis.create({
                attachment: iconURL,
                name: emojiName,
                reason: `Server icon emoji created by ${interaction.user.tag}`
            });

            console.log(`[SERVER-EMOJI] Successfully created emoji: ${emoji.name} (${emoji.id})`);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Server Emoji Created!')
                .setDescription(`Successfully created an emoji from the server icon!`)
                .addFields(
                    {
                        name: '🎨 Emoji',
                        value: `${emoji} \`${emoji}\``,
                        inline: true
                    },
                    {
                        name: '📝 Name',
                        value: `\`${emoji.name}\``,
                        inline: true
                    },
                    {
                        name: '🆔 ID',
                        value: `\`${emoji.id}\``,
                        inline: true
                    },
                    {
                        name: '🔗 Usage',
                        value: `Copy and paste: ${emoji}\nOr type: \`<:${emoji.name}:${emoji.id}>\``,
                        inline: false
                    },
                    {
                        name: '📊 Server Emoji Slots',
                        value: `**Used:** ${interaction.guild.emojis.cache.size} / ${interaction.guild.premiumTier === 0 ? 50 : interaction.guild.premiumTier === 1 ? 100 : interaction.guild.premiumTier === 2 ? 150 : 250}\n` +
                               `**Boost Level:** ${interaction.guild.premiumTier}`,
                        inline: false
                    }
                )
                .setThumbnail(emoji.url)
                .setFooter({ text: `Created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('[SERVER-EMOJI] Error creating emoji:', error);

            let errorMessage = '❌ **Failed to Create Emoji!**\n\n';

            if (error.code === 30008) {
                errorMessage += '**Error:** Maximum number of emojis reached!\n\n';
                errorMessage += `This server has reached its emoji limit. `;
                errorMessage += `Boost the server to unlock more emoji slots or delete some existing emojis.`;
            } else if (error.code === 50035) {
                errorMessage += '**Error:** Invalid emoji data!\n\n';
                errorMessage += `The server icon might be in an unsupported format or too large.`;
            } else if (error.code === 50013) {
                errorMessage += '**Error:** Missing permissions!\n\n';
                errorMessage += `I don't have permission to manage emojis in this server.`;
            } else {
                errorMessage += `**Error:** ${error.message}\n\n`;
                errorMessage += `Please try again or contact support if the issue persists.`;
            }

            await interaction.editReply({ content: errorMessage });
        }
    },
};

