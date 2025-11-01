const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const { saveReactionRole } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-reactionroles')
        .setDescription('Setup reaction roles system (Admin only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send reaction roles message')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Check if user has administrator permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ You need Administrator permission to use this command!',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            const channel = interaction.options.getChannel('channel');
            const guild = interaction.guild;

            // Check if bot can send messages in that channel
            if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                return await interaction.editReply({
                    content: '❌ I don\'t have permission to send messages in that channel!'
                });
            }

            // Check if bot can manage roles
            if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.editReply({
                    content: '❌ I need **Manage Roles** permission to create and assign roles!'
                });
            }

            await interaction.editReply({
                content: '🔄 Creating roles and setting up reaction roles system...'
            });

            // Define role configurations
            const roleConfigs = [
                // Notification Roles
                { name: 'Announcements', emoji: { name: 'Announcement', id: '1427596877431570455' }, color: '#5865F2', category: 'notification', buttonId: 'rr_announcements' },
                { name: 'Events', emoji: { name: 'event', id: '1427596921626689600' }, color: '#5865F2', category: 'notification', buttonId: 'rr_events' },
                { name: 'Updates', emoji: { name: 's_list', id: '1427597074886557730' }, color: '#5865F2', category: 'notification', buttonId: 'rr_updates' },

                // Community Roles
                { name: 'Gamer', emoji: { name: 'AMD_Ryzen_B450_Custom_Gaming_pc', id: '1427596787874795561' }, color: '#57F287', category: 'community', buttonId: 'rr_gamer' },
                { name: 'Developer', emoji: { name: 'coding2', id: '1427596752642637824' }, color: '#57F287', category: 'community', buttonId: 'rr_developer' },
                { name: 'Artist', emoji: { name: 'designer3', id: '1427596404985171979' }, color: '#57F287', category: 'community', buttonId: 'rr_artist' },

                // Color Roles
                { name: 'Red', emoji: '🔴', color: '#ED4245', category: 'color', buttonId: 'rr_color_red' },
                { name: 'Blue', emoji: '🔵', color: '#5865F2', category: 'color', buttonId: 'rr_color_blue' },
                { name: 'Green', emoji: '🟢', color: '#57F287', category: 'color', buttonId: 'rr_color_green' },
                { name: 'Purple', emoji: '🟣', color: '#9B59B6', category: 'color', buttonId: 'rr_color_purple' },

                // Age Roles
                { name: '18+', emoji: { name: '18s', id: '1428002616348250242', animated: true }, color: '#E74C3C', category: 'age', buttonId: 'rr_age_18plus' },
                { name: '18-', emoji: { name: '18m', id: '1428002635000057867', animated: true }, color: '#3498DB', category: 'age', buttonId: 'rr_age_18minus' }
            ];

            // Create or find roles
            const roleMap = new Map();
            let createdCount = 0;
            let existingCount = 0;

            for (const config of roleConfigs) {
                // Check if role already exists
                let role = guild.roles.cache.find(r => r.name === config.name);

                if (!role) {
                    // Create the role
                    try {
                        role = await guild.roles.create({
                            name: config.name,
                            color: config.color,
                            reason: `Reaction role created by ${interaction.user.tag}`,
                            mentionable: false
                        });
                        createdCount++;
                        console.log(`[REACTION-ROLES] Created role: ${config.name}`);
                    } catch (error) {
                        console.error(`Failed to create role ${config.name}:`, error);
                        continue;
                    }
                } else {
                    existingCount++;
                    console.log(`[REACTION-ROLES] Found existing role: ${config.name}`);
                }

                roleMap.set(config.buttonId, {
                    role: role,
                    category: config.category,
                    name: config.name
                });
            }

            // ========== SINGLE MESSAGE WITH ALL ROLES ==========
            const container = new ContainerBuilder();

            // Header
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🎭 Self-Assignable Roles\n` +
                    `*Choose your roles by clicking the buttons below!*`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // ========== NOTIFICATION ROLES ==========
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🔔 Notification Roles\n\n` +
                    `*Get notified about important updates and announcements*`
                )
            );

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('rr_announcements')
                        .setLabel('Announcements')
                        .setEmoji({ name: 'Announcement', id: '1427596877431570455' })
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_events')
                        .setLabel('Events')
                        .setEmoji({ name: 'event', id: '1427596921626689600' })
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_updates')
                        .setLabel('Updates')
                        .setEmoji({ name: 's_list', id: '1427597074886557730' })
                        .setStyle(ButtonStyle.Secondary)
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // ========== COMMUNITY ROLES ==========
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🌟 Community Roles\n\n` +
                    `*Show your interests and connect with like-minded members*`
                )
            );

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('rr_gamer')
                        .setLabel('Gamer')
                        .setEmoji({ name: 'AMD_Ryzen_B450_Custom_Gaming_pc', id: '1427596787874795561' })
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_developer')
                        .setLabel('Developer')
                        .setEmoji({ name: 'coding2', id: '1427596752642637824' })
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_artist')
                        .setLabel('Artist')
                        .setEmoji({ name: 'designer3', id: '1427596404985171979' })
                        .setStyle(ButtonStyle.Secondary)
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // ========== COLOR ROLES ==========
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🎨 Color Roles\n\n` +
                    `*Customize your name color (choose only one)*`
                )
            );

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('rr_color_red')
                        .setLabel('🔴 Red')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_color_blue')
                        .setLabel('🔵 Blue')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_color_green')
                        .setLabel('🟢 Green')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_color_purple')
                        .setLabel('🟣 Purple')
                        .setStyle(ButtonStyle.Secondary)
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // ========== AGE ROLES ==========
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 🔞 Age Roles\n\n` +
                    `*Select your age category (choose only one)*`
                )
            );

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('rr_age_18plus')
                        .setLabel('18+')
                        .setEmoji({ name: '18s', id: '1428002616348250242', animated: true })
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rr_age_18minus')
                        .setLabel('18-')
                        .setEmoji({ name: '18m', id: '1428002635000057867', animated: true })
                        .setStyle(ButtonStyle.Secondary)
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
            );

            // Footer
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Click a button to toggle a role on/off • You can have multiple roles from different categories*`
                )
            );

            // Send single message
            const message = await channel.send({
                content: '',
                components: [container],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.IsPersistent
            });

            // Save role mappings to database
            let savedCount = 0;
            let dbError = null;

            for (const [buttonId, roleData] of roleMap.entries()) {
                const result = await saveReactionRole(
                    guild.id,
                    message.id,
                    buttonId,
                    roleData.role.id,
                    roleData.name,
                    roleData.category
                );

                if (result.success) {
                    savedCount++;
                } else {
                    dbError = result.error;
                    console.error(`[REACTION-ROLES] Failed to save mapping for ${buttonId}:`, result.error);
                }
            }

            // Check if database table exists
            if (dbError && dbError.includes('Could not find the table')) {
                return await interaction.editReply({
                    content: `⚠️ **Database Table Missing!**\n\n` +
                             `The \`reaction_roles\` table doesn't exist in your database.\n\n` +
                             `**Please follow these steps:**\n` +
                             `1. Go to your **Supabase Dashboard**\n` +
                             `2. Open **SQL Editor**\n` +
                             `3. Run the SQL from \`REACTION_ROLES_SQL.md\`\n` +
                             `4. Try this command again\n\n` +
                             `**Roles were created but not saved to database.**\n` +
                             `Message ID: \`${message.id}\``
                });
            }

            // Confirm to admin
            await interaction.editReply({
                content: `✅ **Reaction Roles Setup Complete!**\n\n` +
                         `📍 Channel: ${channel}\n` +
                         `🆔 Message ID: \`${message.id}\`\n\n` +
                         `**Roles Created:**\n` +
                         `✅ Created: ${createdCount} new roles\n` +
                         `📋 Existing: ${existingCount} roles\n` +
                         `💾 Saved: ${savedCount} mappings\n\n` +
                         `**Categories:**\n` +
                         `🔔 Notification Roles (3 roles)\n` +
                         `🌟 Community Roles (3 roles)\n` +
                         `🎨 Color Roles (4 roles)\n` +
                         `🔞 Age Roles (2 roles)\n\n` +
                         `**Total:** 12 self-assignable roles\n\n` +
                         `✨ Users can now click buttons to get roles!`
            });

            console.log(`[REACTION-ROLES] ${interaction.user.tag} setup reaction roles in ${channel.name}`);

        } catch (error) {
            console.error('Error setting up reaction roles:', error);
            await interaction.editReply({
                content: '❌ Failed to setup reaction roles. Please try again.'
            });
        }
    },
};

