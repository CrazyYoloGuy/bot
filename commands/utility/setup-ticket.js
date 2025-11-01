const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const { saveTicketConfig } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Setup the ticket system with a beautiful interactive panel')
        .addStringOption(option =>
            option.setName('categoryid')
                .setDescription('The category ID where ticket channels will be created')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The support role that can view and manage tickets')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('enable-claim')
                .setDescription('Enable claim/unclaim buttons in tickets (default: true)')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('reviewchannel')
                .setDescription('The channel where ticket reviews/feedback will be posted')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText))
        .addChannelOption(option =>
            option.setName('logschannel')
                .setDescription('The channel where ticket transcripts will be sent')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText))
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

        const categoryId = interaction.options.getString('categoryid');
        const supportRole = interaction.options.getRole('role');
        const enableClaim = interaction.options.getBoolean('enable-claim') ?? true; // Default to true
        const reviewChannel = interaction.options.getChannel('reviewchannel');
        const logsChannel = interaction.options.getChannel('logschannel');

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
                content: '❌ The provided ID is not a category! Please provide a category ID, not a channel ID.',
                ephemeral: true
            });
        }

        // Validate role exists (already validated by Discord, but double-check)
        if (!supportRole) {
            return await interaction.reply({
                content: '❌ Invalid role! Please provide a valid role.',
                ephemeral: true
            });
        }

        // Save configuration to database
        const result = await saveTicketConfig(
            interaction.guild.id,
            categoryId,
            supportRole.id,
            reviewChannel ? reviewChannel.id : null,
            logsChannel ? logsChannel.id : null,
            enableClaim
        );

        if (!result.success) {
            return await interaction.reply({
                content: `❌ Failed to save ticket configuration: ${result.error}`,
                ephemeral: true
            });
        }
        // Create Components v2 Container with ticket system
        const components = [
            new ContainerBuilder()
                // Header Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# <:828044ticket:1422650891864903690> Support Ticket System`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`Welcome to our **Support Center**! We're here to help you with any questions or issues you may have.`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )

                // How it Works Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## <:559950clipboard:1422650888186495109> How It Works`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**1.** Select a category from the dropdown menu below\n` +
                        `**2.** A private ticket channel will be created for you\n` +
                        `**3.** Our support team will assist you as soon as possible\n` +
                        `**4.** Close the ticket when your issue is resolved`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )

                // Select Menu Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## <:930761homewhite:1422650896340488192> Create a Ticket`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`Select the category that best matches your needs:`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('ticket_category')
                                .setPlaceholder('🎫 Select a ticket category...')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Technical Support')
                                        .setDescription('Get help with technical issues and bugs')
                                        .setValue('tech_support')
                                        .setEmoji({ name: '🛠️' }),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Billing & Payments')
                                        .setDescription('Questions about purchases and subscriptions')
                                        .setValue('billing')
                                        .setEmoji({ name: '💰' }),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('General Question')
                                        .setDescription('General inquiries and information')
                                        .setValue('general')
                                        .setEmoji({ name: '❓' }),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Other Issue')
                                        .setDescription('Other issues not listed above')
                                        .setValue('other')
                                        .setEmoji({ name: '📝' }),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Cancel')
                                        .setDescription('Cancel ticket creation')
                                        .setValue('cancel')
                                        .setEmoji({ name: '❌' })
                                )
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )

                // Quick Actions Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## <:43365tools:1422650883329495141>  Quick Actions`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('View My Tickets')
                                .setEmoji({ name: '📂' })
                                .setCustomId('view_my_tickets'),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('FAQ')
                                .setEmoji({ name: '📚' })
                                .setCustomId('view_faq')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )

                // Important Information Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## <:140268information:1422650885745541183> Important Information`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `• **Response Time:** We typically respond within 1-24 hours\n` +
                        `• **Be Patient:** Our team will help you as soon as possible\n` +
                        `• **Be Respectful:** Treat our staff with respect and courtesy\n` +
                        `• **One Issue Per Ticket:** Create separate tickets for different issues`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )

                // Footer Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*Need help? Our support team is here for you 24/7!*`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel('Support VC')
                                .setEmoji({ name: '🎤' })
                                .setURL('https://discord.com/channels/1416057641515618409/1428108098614071336'),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('Documentation')
                                .setEmoji({ name: '📖' })
                                .setCustomId('ticket_documentation'),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('Status Page')
                                .setEmoji({ name: '📊' })
                                .setCustomId('ticket_status')
                        )
                )
        ];

        // Send confirmation to the admin first (ephemeral)
        await interaction.reply({
            content: '✅ Ticket system is being set up in this channel...',
            ephemeral: true
        });

        // Send the ticket panel to the channel as a regular message (not a reply)
        await interaction.channel.send({
            components: components,
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });

        // Update the confirmation
        await interaction.editReply({
            content: `✅ **Ticket system has been set up successfully!**\n\n` +
                     `📁 **Category:** ${category.name}\n` +
                     `👥 **Support Role:** ${supportRole}\n` +
                     `📍 **Panel Channel:** ${interaction.channel}\n` +
                     `${reviewChannel ? `📊 **Review Channel:** ${reviewChannel}\n` : ''}` +
                     `${logsChannel ? `📋 **Logs Channel:** ${logsChannel}\n` : ''}` +
                     `\nUsers can now create tickets by selecting a category from the dropdown menu!`
        });
    },
};

