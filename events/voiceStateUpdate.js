const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getVcSupportConfig } = require('../utils/database');

// Store active support VCs (channelId -> { userId, guildId })
const activeSupportVCs = new Map();

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild;
        const member = newState.member;

        // Get VC support configuration
        let config;
        try {
            config = await getVcSupportConfig(guild.id);
            if (!config.success) {
                return; // No VC support configured for this server
            }
        } catch (error) {
            // Silently fail if database is unreachable
            return;
        }

        const { voice_channel_id, staff_ping_channel_id, category_id } = config.data;

        // User joined the support voice channel
        if (newState.channelId === voice_channel_id && oldState.channelId !== voice_channel_id) {
            try {
                // Create temporary support VC
                const tempVC = await guild.channels.create({
                    name: `📞| Support-${member.user.username}`,
                    type: ChannelType.GuildVoice,
                    parent: category_id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: member.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.Speak
                            ]
                        }
                    ]
                });

                // Move user to the temporary VC
                await member.voice.setChannel(tempVC);

                // Store the temporary VC info
                activeSupportVCs.set(tempVC.id, {
                    userId: member.id,
                    guildId: guild.id,
                    createdAt: Date.now()
                });

                console.log(`[VC SUPPORT] Created temporary VC for ${member.user.tag} (${tempVC.id})`);

                // Send notification to staff channel
                try {
                    const staffChannel = await guild.channels.fetch(staff_ping_channel_id);
                    if (staffChannel) {
                        const notificationEmbed = new EmbedBuilder()
                            .setColor('#5865F2')
                            .setTitle('🎤 New Voice Support Request')
                            .setDescription(`${member} is requesting voice support!`)
                            .addFields(
                                { name: '👤 User', value: `${member.user.tag}`, inline: true },
                                { name: '📞 Channel', value: `${tempVC}`, inline: true },
                                { name: '⏰ Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                            )
                            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                            .setFooter({ text: 'Join the voice channel to assist!' })
                            .setTimestamp();

                        await staffChannel.send({
                            content: `@here`,
                            embeds: [notificationEmbed]
                        });
                    }
                } catch (error) {
                    console.error('[VC SUPPORT] Error sending staff notification:', error);
                }

            } catch (error) {
                console.error('[VC SUPPORT] Error creating temporary VC:', error);
            }
        }

        // Check if a temporary support VC is now empty
        if (oldState.channelId && activeSupportVCs.has(oldState.channelId)) {
            const channel = oldState.channel;
            
            // Check if channel is empty (no members)
            if (channel && channel.members.size === 0) {
                try {
                    const vcInfo = activeSupportVCs.get(oldState.channelId);
                    
                    // Delete the empty temporary VC
                    await channel.delete();
                    activeSupportVCs.delete(oldState.channelId);

                    const duration = Math.floor((Date.now() - vcInfo.createdAt) / 1000);
                    console.log(`[VC SUPPORT] Deleted empty temporary VC ${oldState.channelId} (lasted ${duration}s)`);

                    // Send closure notification to staff channel
                    try {
                        const staffChannel = await guild.channels.fetch(staff_ping_channel_id);
                        if (staffChannel) {
                            const user = await guild.client.users.fetch(vcInfo.userId).catch(() => null);
                            const username = user ? user.tag : 'Unknown User';

                            const closeEmbed = new EmbedBuilder()
                                .setColor('#95A5A6')
                                .setTitle('🔒 Voice Support Session Ended')
                                .setDescription(`The support session has ended.`)
                                .addFields(
                                    { name: '👤 User', value: username, inline: true },
                                    { name: '⏱️ Duration', value: `${Math.floor(duration / 60)}m ${duration % 60}s`, inline: true },
                                    { name: '⏰ Ended', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                                )
                                .setTimestamp();

                            await staffChannel.send({ embeds: [closeEmbed] });
                        }
                    } catch (error) {
                        console.error('[VC SUPPORT] Error sending closure notification:', error);
                    }

                } catch (error) {
                    console.error('[VC SUPPORT] Error deleting temporary VC:', error);
                }
            }
        }
    },
};

