const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveLegitConfig, getLegitVoteStats } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-legit')
        .setDescription('Setup the legit verification voting system'),

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
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ You need Administrator permission to use this command!',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;

            // Get current vote stats
            const statsResult = await getLegitVoteStats(guild.id);
            const stats = statsResult.success ? statsResult.data : { total: 0, yes: 0, no: 0 };

            // Calculate percentages
            const yesPercentage = stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0;
            const noPercentage = stats.total > 0 ? Math.round((stats.no / stats.total) * 100) : 0;

            // Create progress bars
            const yesBar = createProgressBar(yesPercentage, 20);
            const noBar = createProgressBar(noPercentage, 20);

            // Create the legit verification embed
            const legitEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🛡️ Legit Verification')
                .setDescription(
                    `**Help us build trust in our community!**\n\n` +
                    `We value transparency and want to know what you think about our services. ` +
                    `Your honest feedback helps us improve and shows potential clients that we're trustworthy.\n\n` +
                    `**Are we legit?** Vote below! 👇`
                )
                .addFields(
                    {
                        name: '✅ Yes - We\'re Legit!',
                        value: `${yesBar} **${stats.yes}** votes (${yesPercentage}%)`,
                        inline: false
                    },
                    {
                        name: '❌ No - Not Legit',
                        value: `${noBar} **${stats.no}** votes (${noPercentage}%)`,
                        inline: false
                    },
                    {
                        name: '📊 Total Votes',
                        value: `**${stats.total}** community members have voted`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `${guild.name} • Your vote matters!`, 
                    iconURL: guild.iconURL() 
                })
                .setTimestamp();

            // Create buttons
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('legit_vote_yes')
                        .setLabel('✅ Yes, Legit!')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('legit_vote_no')
                        .setLabel('❌ No, Not Legit')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('legit_preview_votes')
                        .setLabel('📊 Preview Votes')
                        .setStyle(ButtonStyle.Primary)
                );

            // Send the legit verification message
            const message = await interaction.channel.send({
                embeds: [legitEmbed],
                components: [buttons]
            });

            // Save configuration to database
            await saveLegitConfig(guild.id, message.id, interaction.channel.id);

            // Send success confirmation
            await interaction.editReply({
                content: '✅ Legit verification system has been set up successfully!\n\n' +
                         '**Features:**\n' +
                         '• Users can vote Yes or No\n' +
                         '• Votes are saved with user avatars\n' +
                         '• Preview votes with pagination (15 per page)\n' +
                         '• Real-time vote statistics\n' +
                         '• Users can change their vote anytime',
                ephemeral: true
            });

            console.log(`[SETUP-LEGIT] ${interaction.user.tag} set up legit verification in ${guild.name}`);

        } catch (error) {
            console.error('Error setting up legit verification:', error);
            await interaction.editReply({
                content: '❌ Failed to set up legit verification system. Please try again.',
                ephemeral: true
            });
        }
    },
};

// Helper function to create progress bars
function createProgressBar(percentage, length = 20) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `\`${bar}\``;
}

