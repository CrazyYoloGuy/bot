const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes a specified number of messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-1000)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount');
        const channel = interaction.channel;

        // Check if bot has permission to manage messages
        if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ I don\'t have permission to delete messages in this channel!',
                flags: MessageFlags.Ephemeral
            });
        }

        // Defer reply since this might take a while
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            let deletedCount = 0;
            let remainingToDelete = amount;
            const startTime = Date.now();

            console.log(`[CLEAR] ${interaction.user.tag} is deleting ${amount} messages in #${channel.name}`);

            // Discord's bulk delete limit is 100 messages per request
            // Also, messages older than 14 days cannot be bulk deleted
            while (remainingToDelete > 0) {
                const deleteAmount = Math.min(remainingToDelete, 100);

                try {
                    // Fetch messages
                    const messages = await channel.messages.fetch({ limit: deleteAmount });

                    if (messages.size === 0) {
                        break; // No more messages to delete
                    }

                    // Filter out messages older than 14 days (Discord limitation)
                    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
                    const recentMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

                    if (recentMessages.size === 0) {
                        // All remaining messages are too old
                        break;
                    }

                    // Bulk delete the messages
                    const deleted = await channel.bulkDelete(recentMessages, true);
                    deletedCount += deleted.size;
                    remainingToDelete -= deleted.size;

                    console.log(`[CLEAR] Deleted ${deleted.size} messages (${deletedCount}/${amount} total)`);

                    // If we deleted fewer messages than requested, we've hit the end
                    if (deleted.size < deleteAmount) {
                        break;
                    }

                    // Small delay to avoid rate limits (only if we need to continue)
                    if (remainingToDelete > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (error) {
                    console.error('[CLEAR] Error during bulk delete:', error);
                    break;
                }
            }

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(1);

            // Success message
            let message = `✅ **Messages Deleted Successfully!**\n\n`;
            message += `📊 **Deleted:** ${deletedCount} message${deletedCount !== 1 ? 's' : ''}\n`;

            if (deletedCount < amount) {
                const notDeleted = amount - deletedCount;
                message += `⚠️ **Not Deleted:** ${notDeleted} message${notDeleted !== 1 ? 's' : ''}\n`;
                message += `\n*Some messages may be older than 14 days or already deleted.*`;
            }

            message += `\n⏱️ **Time Taken:** ${duration}s`;
            message += `\n📍 **Channel:** ${channel}`;
            message += `\n👤 **Moderator:** ${interaction.user}`;

            await interaction.editReply({
                content: message
            });

            console.log(`[CLEAR] ${interaction.user.tag} deleted ${deletedCount} messages in ${duration}s`);

        } catch (error) {
            console.error('[CLEAR] Error:', error);

            let errorMessage = '❌ **Failed to delete messages!**\n\n';

            if (error.code === 50013) {
                errorMessage += '**Error:** Missing Permissions\n';
                errorMessage += '*I need "Manage Messages" permission to delete messages.*';
            } else if (error.code === 50034) {
                errorMessage += '**Error:** Messages Too Old\n';
                errorMessage += '*Discord only allows bulk deletion of messages less than 14 days old.*';
            } else {
                errorMessage += `**Error:** ${error.message}`;
            }

            await interaction.editReply({
                content: errorMessage
            });
        }
    },
};

