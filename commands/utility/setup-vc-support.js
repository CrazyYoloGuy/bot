const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');
const { saveVcSupportConfig } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-vc-support')
        .setDescription('Setup voice channel support system')
        .addChannelOption(option =>
            option.setName('voicechannel')
                .setDescription('The voice channel users join to request support')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice))
        .addChannelOption(option =>
            option.setName('staffchannel')
                .setDescription('The text channel where staff will be notified')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('categoryid')
                .setDescription('The category ID where temporary support VCs will be created')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        const voiceChannel = interaction.options.getChannel('voicechannel');
        const staffChannel = interaction.options.getChannel('staffchannel');
        const categoryId = interaction.options.getString('categoryid');

        // Validate category exists and is a category
        const category = await interaction.guild.channels.fetch(categoryId).catch(() => null);

        if (!category) {
            return await interaction.reply({
                content: '❌ Invalid category ID! Please provide a valid category ID.',
                ephemeral: true
            });
        }

        if (category.type !== ChannelType.GuildCategory) {
            return await interaction.reply({
                content: '❌ The provided ID is not a category! Please provide a category ID.',
                ephemeral: true
            });
        }

        // Save configuration to database
        const result = await saveVcSupportConfig(
            interaction.guild.id,
            voiceChannel.id,
            staffChannel.id,
            categoryId
        );

        if (!result.success) {
            return await interaction.reply({
                content: `❌ Failed to save VC support configuration: ${result.error}`,
                ephemeral: true
            });
        }

        // Send success message
        const successEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Voice Support System Configured!')
            .setDescription('The voice channel support system has been set up successfully!')
            .addFields(
                { name: '🎤 Support Voice Channel', value: `${voiceChannel}`, inline: false },
                { name: '📢 Staff Notification Channel', value: `${staffChannel}`, inline: false },
                { name: '📁 Temporary VC Category', value: `${category.name}`, inline: false }
            )
            .setFooter({ text: 'When users join the support VC, a temporary channel will be created!' })
            .setTimestamp();

        await interaction.reply({
            embeds: [successEmbed],
            ephemeral: true
        });
    },
};

