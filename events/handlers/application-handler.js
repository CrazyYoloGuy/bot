const { Events, MessageFlags } = require('discord.js');
const { getApplicationConfig } = require('../../utils/database');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle button interactions for Applications
        if (interaction.isButton() && interaction.customId.startsWith('apply_')) {
            try {
                // Defer reply (ephemeral)
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const customId = interaction.customId;
                const member = interaction.member;
                const guild = interaction.guild;

                // Parse team from custom ID
                let teamName = '';
                let teamEmoji = '';
                
                if (customId === 'apply_dx_team') {
                    teamName = 'DX Team';
                    teamEmoji = '🔷';
                } else if (customId === 'apply_sales_team') {
                    teamName = 'Sales Team';
                    teamEmoji = '💰';
                } else if (customId === 'apply_media_team') {
                    teamName = 'Media Team';
                    teamEmoji = '🎬';
                } else if (customId === 'apply_visionary_team') {
                    teamName = 'Visionary Team';
                    teamEmoji = '💡';
                }

                // TODO: Implement application form/modal here
                // For now, just send a confirmation message

                await interaction.editReply({
                    content: `✅ **Application Submitted!**\n\n` +
                             `**Team:** ${teamEmoji} ${teamName}\n` +
                             `**Applicant:** ${member.user.tag}\n\n` +
                             `*Your application has been received. Our team will review it shortly.*\n\n` +
                             `**Next Steps:**\n` +
                             `• Wait for a response from the team\n` +
                             `• Check your DMs for updates\n` +
                             `• Be patient, we review all applications carefully\n\n` +
                             `*Application functionality will be fully implemented soon.*`
                });

                console.log(`[APPLICATION] ${member.user.tag} applied for ${teamName}`);

            } catch (error) {
                console.error('Error handling application:', error);
                
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ An error occurred while processing your application. Please try again.'
                    }).catch(() => {});
                } else {
                    await interaction.reply({
                        content: '❌ An error occurred while processing your application. Please try again.',
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                }
            }
        }
    },
};

