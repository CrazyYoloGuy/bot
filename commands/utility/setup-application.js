const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SectionBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const { saveApplicationConfig } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-application')
        .setDescription('Setup application system with team selection')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to send the application message')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('banner-url')
                .setDescription('URL of the banner image (optional)')
                .setRequired(false)
        )
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

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const channel = interaction.options.getChannel('channel');
            const bannerUrl = interaction.options.getString('banner-url');
            const guild = interaction.guild;

            // Check if bot can send messages in that channel
            if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                return await interaction.editReply({
                    content: '❌ I don\'t have permission to send messages in that channel!'
                });
            }

            await interaction.editReply({
                content: '🔄 Setting up application system...'
            });

            // Build the application message with Components v2
            const container = new ContainerBuilder()
                .setAccentColor(0x5865F2); // Discord blurple color

            // Banner image (if provided)
            if (bannerUrl) {
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`![Banner](${bannerUrl})`)
                );

                container.addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                );
            }

            // DX Team Section
            container.addSectionComponents(
                new SectionBuilder()
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId('apply_dx_team')
                            .setLabel('Apply')
                            .setStyle(ButtonStyle.Primary)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# 🔷 DX Team\n\n` +
                            `The central force that keeps everything aligned strategy, execution, and coordination across all teams.`
                        )
                    )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // Sales Team Section
            container.addSectionComponents(
                new SectionBuilder()
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId('apply_sales_team')
                            .setLabel('Apply')
                            .setStyle(ButtonStyle.Success)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# 💰 Sales Team\n\n` +
                            `Focused on growth. They bring in clients, build strong relationships, and keep opportunities flowing.`
                        )
                    )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // Media Team Section
            container.addSectionComponents(
                new SectionBuilder()
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId('apply_media_team')
                            .setLabel('Apply')
                            .setStyle(ButtonStyle.Secondary)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# 🎬 Media Team\n\n` +
                            `The creative storytellers. They handle content, campaigns, and communication to shape the brand's presence.`
                        )
                    )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            );

            // Visionary Team Section
            container.addSectionComponents(
                new SectionBuilder()
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId('apply_visionary_team')
                            .setLabel('Apply')
                            .setStyle(ButtonStyle.Secondary)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# 💡 Visionary Team\n\n` +
                            `The idea hub. They explore fresh concepts and guide the direction with innovation and vision.`
                        )
                    )
            );

            // Send the message (components must be an array)
            const message = await channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.IsPersistent
            });

            // Save configuration to database
            const result = await saveApplicationConfig(
                guild.id,
                channel.id,
                message.id,
                bannerUrl
            );

            if (!result.success) {
                console.error('[APPLICATION] Failed to save config:', result.error);
            }

            // Confirm to admin
            await interaction.editReply({
                content: `✅ **Application System Setup Complete!**\n\n` +
                         `📍 Channel: ${channel}\n` +
                         `🆔 Message ID: \`${message.id}\`\n\n` +
                         `**Teams Available:**\n` +
                         `🔷 DX Team\n` +
                         `💰 Sales Team\n` +
                         `🎬 Media Team\n` +
                         `💡 Visionary Team\n\n` +
                         `✨ Users can now click buttons to apply for teams!`
            });

            console.log(`[APPLICATION] Setup complete in ${channel.name} by ${interaction.user.tag}`);

        } catch (error) {
            console.error('Error setting up application system:', error);
            await interaction.editReply({
                content: '❌ An error occurred while setting up the application system. Please try again.'
            }).catch(() => {});
        }
    },
};

