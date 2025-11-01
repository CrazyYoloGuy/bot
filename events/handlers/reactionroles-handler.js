const { Events } = require('discord.js');
const { getReactionRoleByButton, getReactionRoles } = require('../../utils/database');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle button interactions for Reaction Roles
        if (interaction.isButton() && interaction.customId.startsWith('rr_')) {
            try {
                // Defer reply (ephemeral)
                await interaction.deferReply({ flags: 64 });

                const customId = interaction.customId;
                const member = interaction.member;
                const guild = interaction.guild;

                // Get role mapping from database
                const result = await getReactionRoleByButton(guild.id, customId);

                if (!result.success) {
                    // Check if it's a database table error
                    if (result.error && result.error.includes('Could not find the table')) {
                        return await interaction.editReply({
                            content: `⚠️ **Database Not Setup!**\n\n` +
                                     `The reaction roles database table is missing.\n\n` +
                                     `**Administrator:** Please run the SQL from \`REACTION_ROLES_SQL.md\` in Supabase.`
                        });
                    }

                    return await interaction.editReply({
                        content: '❌ This reaction role is not configured properly. Please contact an administrator.'
                    });
                }

                if (!result.data) {
                    return await interaction.editReply({
                        content: '❌ This reaction role is not configured. Please ask an administrator to run `/setup-reactionroles` again.'
                    });
                }

                const roleData = result.data;
                const role = guild.roles.cache.get(roleData.role_id);

                if (!role) {
                    return await interaction.editReply({
                        content: `❌ The role **${roleData.role_name}** no longer exists. Please contact an administrator.`
                    });
                }

                // Check if bot can manage this role
                if (role.position >= guild.members.me.roles.highest.position) {
                    return await interaction.editReply({
                        content: `❌ I cannot manage the **${role.name}** role because it's higher than my highest role.`
                    });
                }

                // Check if user already has the role
                const hasRole = member.roles.cache.has(role.id);

                if (hasRole) {
                    // Remove the role
                    await member.roles.remove(role);

                    await interaction.editReply({
                        content: `✅ **Role Removed!**\n\n` +
                                 `You no longer have the **${role.name}** role.\n\n` +
                                 `*Click the button again to get it back.*`
                    });

                    console.log(`[REACTION-ROLES] ${member.user.tag} removed role: ${role.name}`);
                } else {
                    // Handle color roles (remove other color roles first)
                    if (roleData.category === 'color') {
                        const allRolesResult = await getReactionRoles(guild.id);
                        if (allRolesResult.success) {
                            const colorRoles = allRolesResult.data
                                .filter(r => r.category === 'color' && r.role_id !== role.id)
                                .map(r => r.role_id);

                            // Remove all other color roles
                            const rolesToRemove = member.roles.cache.filter(r => colorRoles.includes(r.id));
                            if (rolesToRemove.size > 0) {
                                await member.roles.remove(rolesToRemove);
                            }
                        }
                    }

                    // Handle age roles (remove other age roles first)
                    if (roleData.category === 'age') {
                        const allRolesResult = await getReactionRoles(guild.id);
                        if (allRolesResult.success) {
                            const ageRoles = allRolesResult.data
                                .filter(r => r.category === 'age' && r.role_id !== role.id)
                                .map(r => r.role_id);

                            // Remove all other age roles
                            const rolesToRemove = member.roles.cache.filter(r => ageRoles.includes(r.id));
                            if (rolesToRemove.size > 0) {
                                await member.roles.remove(rolesToRemove);
                            }
                        }
                    }

                    // Add the role
                    await member.roles.add(role);

                    let message = `✅ **Role Added!**\n\n` +
                                  `You now have the **${role.name}** role!`;

                    if (roleData.category === 'color') {
                        message += `\n\n*Your name color has been updated!*`;
                    } else if (roleData.category === 'notification') {
                        message += `\n\n*You will now receive notifications for this category.*`;
                    } else if (roleData.category === 'community') {
                        message += `\n\n*You can now connect with others who share this interest!*`;
                    } else if (roleData.category === 'age') {
                        message += `\n\n*Your age category has been set.*`;
                    }

                    message += `\n\n*Click the button again to remove this role.*`;

                    await interaction.editReply({
                        content: message
                    });

                    console.log(`[REACTION-ROLES] ${member.user.tag} added role: ${role.name}`);
                }

            } catch (error) {
                console.error('Error handling reaction role:', error);

                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ An error occurred while processing your request. Please try again.'
                    }).catch(() => {});
                } else {
                    await interaction.reply({
                        content: '❌ An error occurred while processing your request. Please try again.',
                        flags: 64
                    }).catch(() => {});
                }
            }
        }
    },
};

