const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { resetAllDatabaseData } = require('../../utils/database');

// Your user ID - only you can use this command
const AUTHORIZED_USER_ID = '1166418335999725599';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('del-db')
        .setDescription('⚠️ DANGER: Delete all database data (Owner only)'),
    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Check if user is authorized
        if (interaction.user.id !== AUTHORIZED_USER_ID) {
            return await interaction.reply({
                content: '❌ You are not authorized to use this command!',
                ephemeral: true
            });
        }

        // Create confirmation embed
        const warningEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('⚠️ DANGER: Database Reset Confirmation')
            .setDescription(
                '**You are about to delete ALL data from the database!**\n\n' +
                '**This will permanently delete:**\n' +
                '🗑️ All ticket configurations\n' +
                '🗑️ All tickets (open and closed)\n' +
                '🗑️ All ticket messages\n' +
                '🗑️ All ticket logs\n' +
                '🗑️ All VC support configurations\n\n' +
                '**⚠️ THIS ACTION CANNOT BE UNDONE! ⚠️**\n\n' +
                'Are you absolutely sure you want to proceed?'
            )
            .setFooter({ text: 'This action is irreversible!' })
            .setTimestamp();

        // Create confirmation buttons
        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('db_reset_confirm')
                    .setLabel('Yes, Delete Everything')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('db_reset_cancel')
                    .setLabel('Cancel')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Send confirmation message
        const response = await interaction.reply({
            embeds: [warningEmbed],
            components: [confirmRow],
            ephemeral: true
        });

        // Create collector for button interactions
        const collectorFilter = i => i.user.id === interaction.user.id;
        
        try {
            const confirmation = await response.awaitMessageComponent({ 
                filter: collectorFilter, 
                time: 30000 // 30 seconds to respond
            });

            if (confirmation.customId === 'db_reset_confirm') {
                // User confirmed - proceed with deletion
                await confirmation.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FEE75C')
                            .setTitle('🔄 Deleting Database Data...')
                            .setDescription('Please wait while all data is being deleted...')
                    ],
                    components: []
                });

                // Perform database reset
                const result = await resetAllDatabaseData();

                if (result.success) {
                    // Success embed
                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('✅ Database Reset Complete')
                        .setDescription('All database data has been successfully deleted!')
                        .addFields(
                            { name: '🗑️ Ticket Logs Deleted', value: `${result.results.ticket_logs || 0} records`, inline: true },
                            { name: '🗑️ Ticket Messages Deleted', value: `${result.results.ticket_messages || 0} records`, inline: true },
                            { name: '🗑️ Tickets Deleted', value: `${result.results.tickets || 0} records`, inline: true },
                            { name: '🗑️ Ticket Configs Deleted', value: `${result.results.ticket_config || 0} records`, inline: true },
                            { name: '🗑️ VC Support Configs Deleted', value: `${result.results.vc_support_config || 0} records`, inline: true }
                        )
                        .setFooter({ text: 'You can now set up everything from scratch!' })
                        .setTimestamp();

                    await confirmation.editReply({
                        embeds: [successEmbed],
                        components: []
                    });

                    console.log(`[DATABASE] All data deleted by ${interaction.user.tag} (${interaction.user.id})`);
                } else {
                    // Error embed
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle('❌ Database Reset Failed')
                        .setDescription(`An error occurred while deleting data:\n\`\`\`${result.error}\`\`\``)
                        .setTimestamp();

                    await confirmation.editReply({
                        embeds: [errorEmbed],
                        components: []
                    });

                    console.error(`[DATABASE] Reset failed: ${result.error}`);
                }

            } else if (confirmation.customId === 'db_reset_cancel') {
                // User cancelled
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('❌ Database Reset Cancelled')
                    .setDescription('No data was deleted. The database remains unchanged.')
                    .setTimestamp();

                await confirmation.update({
                    embeds: [cancelEmbed],
                    components: []
                });

                console.log(`[DATABASE] Reset cancelled by ${interaction.user.tag}`);
            }

        } catch (error) {
            // Timeout or error
            if (error.message.includes('time')) {
                // Timeout
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('⏱️ Confirmation Timeout')
                    .setDescription('You did not respond in time. No data was deleted.')
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: []
                });
            } else {
                console.error('[DATABASE] Error in del-db command:', error);
            }
        }
    },
};

