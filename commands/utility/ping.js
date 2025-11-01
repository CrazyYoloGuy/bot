const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with bot latency!'),
    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        await interaction.editReply(`🏓 Pong!\n📡 Latency: ${latency}ms\n💓 API Latency: ${apiLatency}ms`);
    },
};

