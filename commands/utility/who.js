const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('who')
        .setDescription('Get detailed information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('User ID to lookup')
                .setRequired(false)
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

        await interaction.deferReply({ flags: 64 }); // Ephemeral

        try {
            const guild = interaction.guild;
            let targetUser = interaction.options.getUser('user');
            const userId = interaction.options.getString('userid');

            // If no user provided, use command author
            if (!targetUser && !userId) {
                targetUser = interaction.user;
            }

            // If user ID provided, try to fetch user
            if (userId && !targetUser) {
                try {
                    targetUser = await client.users.fetch(userId);
                } catch (error) {
                    return await interaction.editReply({
                        content: '❌ Could not find user with that ID!'
                    });
                }
            }

            // Try to get member object
            let member = null;
            try {
                member = await guild.members.fetch(targetUser.id);
            } catch (error) {
                // User not in server
            }

            // Get user info
            const userCreated = Math.floor(targetUser.createdTimestamp / 1000);
            const accountAge = Math.floor((Date.now() - targetUser.createdTimestamp) / (1000 * 60 * 60 * 24));
            
            // Get member info if in server
            let joinedTimestamp = null;
            let serverAge = null;
            let roles = [];
            let nickname = null;
            let permissions = [];
            
            if (member) {
                joinedTimestamp = Math.floor(member.joinedTimestamp / 1000);
                serverAge = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
                roles = member.roles.cache
                    .filter(role => role.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => role.toString())
                    .slice(0, 10);
                nickname = member.nickname;
                
                // Get key permissions
                if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                    permissions.push('Administrator');
                } else {
                    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) permissions.push('Manage Server');
                    if (member.permissions.has(PermissionFlagsBits.ManageRoles)) permissions.push('Manage Roles');
                    if (member.permissions.has(PermissionFlagsBits.ManageChannels)) permissions.push('Manage Channels');
                    if (member.permissions.has(PermissionFlagsBits.KickMembers)) permissions.push('Kick Members');
                    if (member.permissions.has(PermissionFlagsBits.BanMembers)) permissions.push('Ban Members');
                    if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) permissions.push('Timeout Members');
                }
            }

            // Get avatars and banner
            const avatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 512 });
            const avatarGIF = targetUser.displayAvatarURL({ extension: 'gif', size: 512 });
            let bannerURL = null;
            
            try {
                const fetchedUser = await targetUser.fetch();
                if (fetchedUser.banner) {
                    bannerURL = fetchedUser.bannerURL({ extension: 'png', size: 1024 });
                }
            } catch (error) {
                // No banner
            }

            // Determine user status
            let statusEmoji = '⚫';
            let statusText = 'Offline';
            if (member && member.presence) {
                switch (member.presence.status) {
                    case 'online':
                        statusEmoji = '🟢';
                        statusText = 'Online';
                        break;
                    case 'idle':
                        statusEmoji = '🟡';
                        statusText = 'Idle';
                        break;
                    case 'dnd':
                        statusEmoji = '🔴';
                        statusText = 'Do Not Disturb';
                        break;
                }
            }

            // Check if user is bot
            const botBadge = targetUser.bot ? '🤖 Bot' : '👤 User';

            // Create Components v2 Container
            const container = new ContainerBuilder();

            // Header with avatar and basic info
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# ${statusEmoji} ${targetUser.username}\n` +
                    `**${targetUser.tag}**`
                )
            );

            // User badge and status
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${botBadge} • ${statusText}`
                )
            );

            // User ID
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**User ID:** \`${targetUser.id}\``
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // Account Information Section
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 📅 Account Information`)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Created:** <t:${userCreated}:F>\n` +
                    `**Age:** <t:${userCreated}:R> • *${accountAge} days*`
                )
            );

            // Server Information Section (if member)
            if (member) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 📥 Server Information`)
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Joined:** <t:${joinedTimestamp}:F>\n` +
                        `**Member for:** <t:${joinedTimestamp}:R> • *${serverAge} days*`
                    )
                );

                if (nickname) {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**Nickname:** ${nickname}`
                        )
                    );
                }

                // Roles Section
                if (roles.length > 0) {
                    container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                    );

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 🎭 Roles [${member.roles.cache.size - 1}]`
                        )
                    );

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            roles.join(' • ') + (member.roles.cache.size > 11 ? ' • ...' : '')
                        )
                    );
                }

                // Permissions Section
                if (permissions.length > 0) {
                    container.addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                    );

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 🔑 Key Permissions`
                        )
                    );

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `✅ ${permissions.join('\n✅ ')}`
                        )
                    );
                }
            } else {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `⚠️ **Not in this server**`
                    )
                );
            }

            // Avatar Section
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 🖼️ Profile Assets`)
            );

            // Add avatar button to container
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Download Avatar (PNG)')
                        .setEmoji('🖼️')
                        .setStyle(ButtonStyle.Link)
                        .setURL(avatarURL)
                )
            );

            // Add GIF button if avatar is animated
            if (avatarGIF.endsWith('.gif')) {
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Download Avatar (GIF)')
                            .setEmoji('🎞️')
                            .setStyle(ButtonStyle.Link)
                            .setURL(avatarGIF)
                    )
                );
            }

            // Add banner button if exists
            if (bannerURL) {
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Download Banner')
                            .setEmoji('🎨')
                            .setStyle(ButtonStyle.Link)
                            .setURL(bannerURL)
                    )
                );
            }

            // Moderation Section (if has permissions)
            if (member && interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🛡️ Moderation Actions`)
                );

                // Kick button
                if (interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`who_kick_${targetUser.id}`)
                                .setLabel('Kick Member')
                                .setEmoji('👢')
                                .setStyle(ButtonStyle.Danger)
                        )
                    );
                }

                // Ban button
                if (interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`who_ban_${targetUser.id}`)
                                .setLabel('Ban Member')
                                .setEmoji('🔨')
                                .setStyle(ButtonStyle.Danger)
                        )
                    );
                }

                // Timeout button
                if (interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`who_timeout_${targetUser.id}`)
                                .setLabel('Timeout Member')
                                .setEmoji('⏰')
                                .setStyle(ButtonStyle.Secondary)
                        )
                    );
                }
            }

            // Utility Section
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ⚙️ Utilities`)
            );

            // Refresh button
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`who_refresh_${targetUser.id}`)
                        .setLabel('Refresh Information')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Primary)
                )
            );

            // All roles button (if member)
            if (member) {
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`who_roles_${targetUser.id}`)
                            .setLabel('View All Roles')
                            .setEmoji('📋')
                            .setStyle(ButtonStyle.Secondary)
                    )
                );
            }

            // Footer
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Requested by ${interaction.user.tag} • <t:${Math.floor(Date.now() / 1000)}:R>*`
                )
            );

            // Send response with Components v2
            await interaction.editReply({
                content: '',
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

            console.log(`[WHO] ${interaction.user.tag} looked up ${targetUser.tag}`);

        } catch (error) {
            console.error('Error in who command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching user information.'
            });
        }
    },
};

