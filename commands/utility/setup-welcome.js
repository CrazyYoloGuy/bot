const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');
const { saveWelcomeConfig } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Setup welcome messages for new members')
        .addStringOption(option =>
            option.setName('channelid')
                .setDescription('The channel ID where welcome messages will be sent')
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

        const channelId = interaction.options.getString('channelid');

        // Validate channel exists and is a text channel
        const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

        if (!channel) {
            return await interaction.reply({
                content: '❌ Invalid channel ID! Please provide a valid channel ID.',
                ephemeral: true
            });
        }

        if (channel.type !== ChannelType.GuildText) {
            return await interaction.reply({
                content: '❌ The provided channel is not a text channel! Please provide a text channel ID.',
                ephemeral: true
            });
        }

        // Check if bot has permissions to send messages in that channel
        const botPermissions = channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
            return await interaction.reply({
                content: '❌ I don\'t have permission to send messages in that channel! Please give me the "Send Messages" permission.',
                ephemeral: true
            });
        }

        // Save configuration to database
        const result = await saveWelcomeConfig(
            interaction.guild.id,
            channelId
        );

        if (!result.success) {
            return await interaction.reply({
                content: `❌ Failed to save welcome configuration: ${result.error}`,
                ephemeral: true
            });
        }

        // Send success message
        const successEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Welcome System Configured!')
            .setDescription('The welcome system has been set up successfully!')
            .addFields(
                { name: '👋 Welcome Channel', value: `${channel}`, inline: false },
                { name: '📝 What happens now?', value: 'When a new member joins the server, they will receive a beautiful welcome message in this channel!', inline: false }
            )
            .setFooter({ text: 'New members will be greeted automatically!' })
            .setTimestamp();

        await interaction.reply({
            embeds: [successEmbed],
            ephemeral: true
        });
    },
};

