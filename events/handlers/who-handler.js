const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle button interactions for Who command
        if (interaction.isButton() && interaction.customId.startsWith('who_')) {
            const [action, subAction, userId] = interaction.customId.split('_');

            // Check permissions
            const member = interaction.member;
            const guild = interaction.guild;

            try {
                // Refresh action
                if (subAction === 'refresh') {
                    await handleRefresh(interaction, client, userId);
                }
                
                // Show all roles
                else if (subAction === 'roles') {
                    await handleShowRoles(interaction, guild, userId);
                }
                
                // Kick action
                else if (subAction === 'kick') {
                    if (!member.permissions.has(PermissionFlagsBits.KickMembers)) {
                        return await interaction.reply({
                            content: '❌ You don\'t have permission to kick members!',
                            flags: 64
                        });
                    }
                    await handleKick(interaction, guild, userId);
                }
                
                // Ban action
                else if (subAction === 'ban') {
                    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) {
                        return await interaction.reply({
                            content: '❌ You don\'t have permission to ban members!',
                            flags: 64
                        });
                    }
                    await handleBan(interaction, guild, userId);
                }
                
                // Timeout action
                else if (subAction === 'timeout') {
                    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                        return await interaction.reply({
                            content: '❌ You don\'t have permission to timeout members!',
                            flags: 64
                        });
                    }
                    await handleTimeout(interaction, guild, userId);
                }

            } catch (error) {
                console.error('Error handling who interaction:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing your request.',
                    flags: 64
                }).catch(() => {});
            }
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('who_kick_modal_')) {
                await handleKickModal(interaction);
            } else if (interaction.customId.startsWith('who_ban_modal_')) {
                await handleBanModal(interaction);
            } else if (interaction.customId.startsWith('who_timeout_modal_')) {
                await handleTimeoutModal(interaction);
            }
        }
    },
};

// Handle refresh
async function handleRefresh(interaction, client, userId) {
    await interaction.deferUpdate();

    try {
        const targetUser = await client.users.fetch(userId);
        const guild = interaction.guild;
        let member = null;

        try {
            member = await guild.members.fetch(userId);
        } catch (error) {
            // User not in server
        }

        // Rebuild the embed (same logic as command)
        const userCreated = Math.floor(targetUser.createdTimestamp / 1000);
        const accountAge = Math.floor((Date.now() - targetUser.createdTimestamp) / (1000 * 60 * 60 * 24));
        
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

        const botBadge = targetUser.bot ? '🤖 Bot' : '👤 User';

        // Create Components v2 Container
        const container = new ContainerBuilder();

        // Header
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# ${statusEmoji} ${targetUser.username}\n` +
                `**${targetUser.tag}**`
            )
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `${botBadge} • ${statusText}`
            )
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**User ID:** \`${targetUser.id}\``
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        // Account Information
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## 📅 Account Information`)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Created:** <t:${userCreated}:F>\n` +
                `**Age:** <t:${userCreated}:R> • *${accountAge} days*`
            )
        );

        // Server Information
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

            // Roles
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

            // Permissions
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

        // Profile Assets
        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## 🖼️ Profile Assets`)
        );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Download Avatar (PNG)')
                    .setEmoji('🖼️')
                    .setStyle(ButtonStyle.Link)
                    .setURL(avatarURL)
            )
        );

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

        // Moderation Section
        if (member && interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 🛡️ Moderation Actions`)
            );

            if (interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`who_kick_${userId}`)
                            .setLabel('Kick Member')
                            .setEmoji('👢')
                            .setStyle(ButtonStyle.Danger)
                    )
                );
            }

            if (interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`who_ban_${userId}`)
                            .setLabel('Ban Member')
                            .setEmoji('🔨')
                            .setStyle(ButtonStyle.Danger)
                    )
                );
            }

            if (interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`who_timeout_${userId}`)
                            .setLabel('Timeout Member')
                            .setEmoji('⏰')
                            .setStyle(ButtonStyle.Secondary)
                    )
                );
            }
        }

        // Utilities
        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ⚙️ Utilities`)
        );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`who_refresh_${userId}`)
                    .setLabel('Refresh Information')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Primary)
            )
        );

        if (member) {
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`who_roles_${userId}`)
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
                `*Refreshed by ${interaction.user.tag} • <t:${Math.floor(Date.now() / 1000)}:R>*`
            )
        );

        await interaction.editReply({
            content: '',
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error refreshing user info:', error);
    }
}

// Handle show all roles
async function handleShowRoles(interaction, guild, userId) {
    try {
        const member = await guild.members.fetch(userId);
        const roles = member.roles.cache
            .filter(role => role.id !== guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor)
            .setTitle(`🎭 All Roles for ${member.user.tag}`)
            .setDescription(
                roles.length > 0 
                    ? roles.join('\n') 
                    : 'No roles'
            )
            .setFooter({ text: `Total: ${roles.length} roles` })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });

    } catch (error) {
        await interaction.reply({
            content: '❌ Could not fetch roles for this user.',
            flags: 64
        });
    }
}

// Handle kick - show modal
async function handleKick(interaction, guild, userId) {
    const modal = new ModalBuilder()
        .setCustomId(`who_kick_modal_${userId}`)
        .setTitle('Kick Member');

    const reasonInput = new TextInputBuilder()
        .setCustomId('kick_reason')
        .setLabel('Reason for kick')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter reason for kicking this member...')
        .setRequired(false)
        .setMaxLength(500);

    const row = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

// Handle kick modal submission
async function handleKickModal(interaction) {
    await interaction.deferReply({ flags: 64 });

    const userId = interaction.customId.split('_')[3];
    const reason = interaction.fields.getTextInputValue('kick_reason') || 'No reason provided';

    try {
        const member = await interaction.guild.members.fetch(userId);
        
        // Check if bot can kick
        if (!member.kickable) {
            return await interaction.editReply({
                content: '❌ I cannot kick this user! They may have higher roles than me.'
            });
        }

        await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('👢 Member Kicked')
            .setDescription(
                `**User:** ${member.user.tag}\n` +
                `**ID:** \`${member.id}\`\n` +
                `**Reason:** ${reason}\n` +
                `**Kicked by:** ${interaction.user.tag}`
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed]
        });

        console.log(`[WHO-KICK] ${interaction.user.tag} kicked ${member.user.tag}`);

    } catch (error) {
        console.error('Error kicking member:', error);
        await interaction.editReply({
            content: '❌ Failed to kick member. They may have left the server or I lack permissions.'
        });
    }
}

// Handle ban - show modal
async function handleBan(interaction, guild, userId) {
    const modal = new ModalBuilder()
        .setCustomId(`who_ban_modal_${userId}`)
        .setTitle('Ban Member');

    const reasonInput = new TextInputBuilder()
        .setCustomId('ban_reason')
        .setLabel('Reason for ban')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter reason for banning this member...')
        .setRequired(false)
        .setMaxLength(500);

    const deleteInput = new TextInputBuilder()
        .setCustomId('delete_days')
        .setLabel('Delete message history (days: 0-7)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('0')
        .setRequired(false)
        .setMaxLength(1);

    const row1 = new ActionRowBuilder().addComponents(reasonInput);
    const row2 = new ActionRowBuilder().addComponents(deleteInput);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
}

// Handle ban modal submission
async function handleBanModal(interaction) {
    await interaction.deferReply({ flags: 64 });

    const userId = interaction.customId.split('_')[3];
    const reason = interaction.fields.getTextInputValue('ban_reason') || 'No reason provided';
    let deleteDays = parseInt(interaction.fields.getTextInputValue('delete_days')) || 0;
    
    // Validate delete days
    deleteDays = Math.max(0, Math.min(7, deleteDays));

    try {
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        const user = member ? member.user : await interaction.client.users.fetch(userId);
        
        // Check if bot can ban
        if (member && !member.bannable) {
            return await interaction.editReply({
                content: '❌ I cannot ban this user! They may have higher roles than me.'
            });
        }

        await interaction.guild.members.ban(userId, {
            reason: `${reason} | Banned by ${interaction.user.tag}`,
            deleteMessageSeconds: deleteDays * 24 * 60 * 60
        });

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🔨 Member Banned')
            .setDescription(
                `**User:** ${user.tag}\n` +
                `**ID:** \`${user.id}\`\n` +
                `**Reason:** ${reason}\n` +
                `**Messages Deleted:** ${deleteDays} days\n` +
                `**Banned by:** ${interaction.user.tag}`
            )
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed]
        });

        console.log(`[WHO-BAN] ${interaction.user.tag} banned ${user.tag}`);

    } catch (error) {
        console.error('Error banning member:', error);
        await interaction.editReply({
            content: '❌ Failed to ban member. I may lack permissions or the user is already banned.'
        });
    }
}

// Handle timeout - show modal
async function handleTimeout(interaction, guild, userId) {
    const modal = new ModalBuilder()
        .setCustomId(`who_timeout_modal_${userId}`)
        .setTitle('Timeout Member');

    const durationInput = new TextInputBuilder()
        .setCustomId('timeout_duration')
        .setLabel('Duration in minutes (max 40320 = 28 days)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('60')
        .setRequired(true)
        .setMaxLength(5);

    const reasonInput = new TextInputBuilder()
        .setCustomId('timeout_reason')
        .setLabel('Reason for timeout')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter reason for timeout...')
        .setRequired(false)
        .setMaxLength(500);

    const row1 = new ActionRowBuilder().addComponents(durationInput);
    const row2 = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
}

// Handle timeout modal submission
async function handleTimeoutModal(interaction) {
    await interaction.deferReply({ flags: 64 });

    const userId = interaction.customId.split('_')[3];
    let duration = parseInt(interaction.fields.getTextInputValue('timeout_duration'));
    const reason = interaction.fields.getTextInputValue('timeout_reason') || 'No reason provided';

    // Validate duration (max 28 days = 40320 minutes)
    if (isNaN(duration) || duration < 1) {
        return await interaction.editReply({
            content: '❌ Invalid duration! Please enter a number between 1 and 40320 minutes.'
        });
    }
    duration = Math.min(40320, duration);

    try {
        const member = await interaction.guild.members.fetch(userId);
        
        // Check if bot can timeout
        if (!member.moderatable) {
            return await interaction.editReply({
                content: '❌ I cannot timeout this user! They may have higher roles than me.'
            });
        }

        const timeoutUntil = new Date(Date.now() + duration * 60 * 1000);
        await member.timeout(duration * 60 * 1000, `${reason} | Timed out by ${interaction.user.tag}`);

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('⏰ Member Timed Out')
            .setDescription(
                `**User:** ${member.user.tag}\n` +
                `**ID:** \`${member.id}\`\n` +
                `**Duration:** ${duration} minutes\n` +
                `**Until:** <t:${Math.floor(timeoutUntil.getTime() / 1000)}:F>\n` +
                `**Reason:** ${reason}\n` +
                `**Timed out by:** ${interaction.user.tag}`
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed]
        });

        console.log(`[WHO-TIMEOUT] ${interaction.user.tag} timed out ${member.user.tag} for ${duration} minutes`);

    } catch (error) {
        console.error('Error timing out member:', error);
        await interaction.editReply({
            content: '❌ Failed to timeout member. They may have left the server or I lack permissions.'
        });
    }
}

