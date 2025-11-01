const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id);

        // Check if the member is kickable
        if (!member.kickable) {
            return await interaction.reply({ 
                content: '❌ I cannot kick this user! They may have higher permissions than me.', 
                ephemeral: true 
            });
        }

        // Check if the user is trying to kick themselves
        if (target.id === interaction.user.id) {
            return await interaction.reply({ 
                content: '❌ You cannot kick yourself!', 
                ephemeral: true 
            });
        }

        try {
            await member.kick(reason);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('👢 Member Kicked')
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ There was an error trying to kick this user!', 
                ephemeral: true 
            });
        }
    },
};

