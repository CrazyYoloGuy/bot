const {
    Events,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const {
    getTicketConfig,
    createTicket,
    getTicketByChannelId,
    claimTicket,
    unclaimTicket,
    closeTicket,
    saveTicketMessage,
    logTicketAction,
    getTicketsByUserId,
    generateTicketTranscript
} = require('../../utils/database');

// Store feedback responses temporarily
const feedbackResponses = new Map();

// Helper function to send ticket transcript
async function sendTicketTranscript(guild, ticket, channel) {
    try {
        // Get ticket config to find logs channel
        const config = await getTicketConfig(guild.id);
        if (!config.success || !config.data.logs_channel_id) {
            return; // No logs channel configured
        }

        const logsChannel = await guild.channels.fetch(config.data.logs_channel_id).catch(() => null);
        if (!logsChannel) {
            console.log('[TICKET] Logs channel not found');
            return;
        }

        // Fetch all messages from the ticket channel
        const messages = [];
        let lastId;

        while (true) {
            const options = { limit: 100 };
            if (lastId) {
                options.before = lastId;
            }

            const fetchedMessages = await channel.messages.fetch(options);
            if (fetchedMessages.size === 0) break;

            messages.push(...fetchedMessages.values());
            lastId = fetchedMessages.last().id;

            if (fetchedMessages.size < 100) break;
        }

        // Sort messages by timestamp (oldest first)
        messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        // Generate transcript
        const transcript = await generateTicketTranscript(ticket, messages);

        // Create attachment
        const buffer = Buffer.from(transcript, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
            name: `ticket-${ticket.ticket_number}-transcript.txt`
        });

        // Send to logs channel
        await logsChannel.send({
            content: `📋 **Ticket Transcript** - Ticket #${ticket.ticket_number}`,
            files: [attachment]
        });

        console.log(`[TICKET] Transcript sent for ticket #${ticket.ticket_number}`);
    } catch (error) {
        console.error('[TICKET] Error sending transcript:', error);
    }
}

// Helper function to build FAQ content with navigation
function buildFAQContent(category) {
    const categories = {
        general: {
            title: '📋 General Questions',
            emoji: '📋',
            questions: [
                {
                    q: 'How long does it take to get a response?',
                    a: 'Our support team typically responds within **1-24 hours** depending on the complexity of your issue and current ticket volume. Urgent issues are prioritized.'
                },
                {
                    q: 'Can I have multiple tickets open?',
                    a: 'Yes! You can have **multiple tickets open** for different issues. Please create separate tickets for each unique problem to help us assist you better.'
                },
                {
                    q: 'How do I close a ticket?',
                    a: 'Click the **"Close Ticket"** button in your ticket channel. You\'ll be asked to provide feedback before the ticket is closed. Staff members can also close tickets.'
                },
                {
                    q: 'Can I reopen a closed ticket?',
                    a: 'No, closed tickets cannot be reopened. However, you can **create a new ticket** and reference your previous ticket number for context.'
                }
            ]
        },
        technical: {
            title: '🛠️ Technical Support',
            emoji: '🛠️',
            questions: [
                {
                    q: 'What information should I provide for technical issues?',
                    a: '**Please include:**\n• Detailed description of the problem\n• Steps to reproduce the issue\n• Screenshots or error messages\n• Your device/browser information\n• When the issue started'
                },
                {
                    q: 'How do I report a bug or technical issue?',
                    a: 'Create a ticket with the **"Technical Support"** category and provide:\n• What you were doing when the issue occurred\n• Expected vs actual behavior\n• Screenshots if possible\n• Any error messages you received'
                },
                {
                    q: 'What if my issue is urgent?',
                    a: 'For **urgent technical issues**, select the "Technical Support" category and clearly mention **"URGENT"** in your first message. Our team will prioritize your ticket.'
                },
                {
                    q: 'Can I get help via voice chat?',
                    a: 'Yes! Click the **"Support VC"** button on the main ticket panel to join our Support Voice Channel. A staff member will join when available to assist you.'
                }
            ]
        },
        billing: {
            title: '💰 Billing & Payments',
            emoji: '💰',
            questions: [
                {
                    q: 'How do I update my payment information?',
                    a: 'Create a ticket with the **"Billing & Payments"** category. Our billing team will guide you through the secure process of updating your payment details.'
                },
                {
                    q: 'Can I get a refund?',
                    a: 'Refund requests are handled on a **case-by-case basis**. Create a ticket with the "Billing & Payments" category and provide:\n• Order/transaction ID\n• Reason for refund request\n• Date of purchase\n• Payment method used'
                },
                {
                    q: 'What payment methods do you accept?',
                    a: 'We accept various payment methods including:\n• Credit/Debit Cards (Visa, Mastercard, Amex)\n• PayPal\n• Cryptocurrency (Bitcoin, Ethereum)\n• Other methods may be available - contact us for details!'
                },
                {
                    q: 'How do I view my purchase history?',
                    a: 'Create a ticket with the **"Billing & Payments"** category and request your purchase history. Our team will provide you with a detailed breakdown of your transactions.'
                }
            ]
        },
        other: {
            title: '📝 Other Issues',
            emoji: '📝',
            questions: [
                {
                    q: 'What should I use "Other Issue" for?',
                    a: 'Use the **"Other Issue"** category for:\n• Issues that don\'t fit other categories\n• General inquiries\n• Partnership requests\n• Custom service requests\n• Anything else you need help with!'
                },
                {
                    q: 'How do I contact staff directly?',
                    a: 'Please **do not DM staff members** directly. Always create a ticket so your issue is properly tracked and handled by the appropriate team member.'
                },
                {
                    q: 'Can I suggest improvements to the server?',
                    a: 'Absolutely! Create a ticket with the **"Other Issue"** category and share your suggestions. We love hearing feedback from our community!'
                },
                {
                    q: 'What if I need help with something not listed?',
                    a: 'No problem! Create a ticket with the **"Other Issue"** category and describe what you need. Our team is here to help with any questions or concerns.'
                }
            ]
        },
        policies: {
            title: '📜 Policies & Guidelines',
            emoji: '📜',
            questions: [
                {
                    q: 'What are the ticket system rules?',
                    a: '**Please follow these guidelines:**\n• Be respectful to support staff\n• Provide accurate information\n• Don\'t spam or create duplicate tickets\n• One issue per ticket\n• No inappropriate content'
                },
                {
                    q: 'What happens if I violate the rules?',
                    a: 'Rule violations may result in:\n• Warning from staff\n• Temporary ticket creation restrictions\n• Permanent ban from support system\n• Server-wide moderation action\n\nSeverity depends on the violation.'
                },
                {
                    q: 'How is my data handled?',
                    a: 'Your ticket data is:\n• Stored securely in our database\n• Only accessible to support staff\n• Used solely for support purposes\n• Retained for quality assurance\n• Never shared with third parties'
                },
                {
                    q: 'Can I request my ticket history?',
                    a: 'Yes! Click the **"View My Tickets"** button on the main panel to view your ticket history, including active and recently closed tickets.'
                }
            ]
        }
    };

    const currentCategory = categories[category] || categories.general;

    // Build the container
    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# 📚 Frequently Asked Questions`)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`*Navigate between categories using the buttons below*`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

    // Add navigation buttons - all in one row
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('faq_category_general')
                .setLabel('General')
                .setEmoji('📋')
                .setStyle(category === 'general' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(category === 'general'),
            new ButtonBuilder()
                .setCustomId('faq_category_technical')
                .setLabel('Technical')
                .setEmoji('🛠️')
                .setStyle(category === 'technical' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(category === 'technical'),
            new ButtonBuilder()
                .setCustomId('faq_category_billing')
                .setLabel('Billing')
                .setEmoji('💰')
                .setStyle(category === 'billing' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(category === 'billing'),
            new ButtonBuilder()
                .setCustomId('faq_category_other')
                .setLabel('Other')
                .setEmoji('📝')
                .setStyle(category === 'other' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(category === 'other'),
            new ButtonBuilder()
                .setCustomId('faq_category_policies')
                .setLabel('Policies')
                .setEmoji('📜')
                .setStyle(category === 'policies' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(category === 'policies')
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // Add category title
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${currentCategory.emoji} ${currentCategory.title}`)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // Add questions and answers
    currentCategory.questions.forEach((item, index) => {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### ❓ ${item.q}`)
        );
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(item.a)
        );

        // Add separator between questions (but not after the last one)
        if (index < currentCategory.questions.length - 1) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            );
        }
    });

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Still have questions? Create a ticket and our support team will help you!*`)
    );

    return [container];
}

// Helper function to build feedback form
function buildFeedbackForm(ticketId, ticketNumber, feedback) {
    return [
        new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# <:828044ticket:1422650891864903690> Ticket Feedback`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Ticket #${ticketNumber}** is being closed. Please rate your experience:\n\nThank you for using our support system! We'd love to hear about your experience.`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ❓ Question 1: How would you rate the response time?`)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`feedback_q1_1_${ticketId}`)
                            .setLabel('1⭐')
                            .setStyle(feedback.q1 === 1 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q1 && feedback.q1 !== 1),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q1_2_${ticketId}`)
                            .setLabel('2⭐')
                            .setStyle(feedback.q1 === 2 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q1 && feedback.q1 !== 2),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q1_3_${ticketId}`)
                            .setLabel('3⭐')
                            .setStyle(feedback.q1 === 3 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q1 && feedback.q1 !== 3),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q1_4_${ticketId}`)
                            .setLabel('4⭐')
                            .setStyle(feedback.q1 === 4 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q1 && feedback.q1 !== 4),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q1_5_${ticketId}`)
                            .setLabel('5⭐')
                            .setStyle(feedback.q1 === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q1 && feedback.q1 !== 5)
                    )
            )
            .addActionRowComponents(
                feedback.q1 ? new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`feedback_edit_q1_${ticketId}`)
                            .setLabel('Edit Answer')
                            .setEmoji('✏️')
                            .setStyle(ButtonStyle.Secondary)
                    ) : new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('placeholder_q1')
                            .setLabel('Select a rating above')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ❓ Question 2: How helpful was the support staff?`)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`feedback_q2_1_${ticketId}`)
                            .setLabel('1⭐')
                            .setStyle(feedback.q2 === 1 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q2 && feedback.q2 !== 1),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q2_2_${ticketId}`)
                            .setLabel('2⭐')
                            .setStyle(feedback.q2 === 2 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q2 && feedback.q2 !== 2),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q2_3_${ticketId}`)
                            .setLabel('3⭐')
                            .setStyle(feedback.q2 === 3 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q2 && feedback.q2 !== 3),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q2_4_${ticketId}`)
                            .setLabel('4⭐')
                            .setStyle(feedback.q2 === 4 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q2 && feedback.q2 !== 4),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q2_5_${ticketId}`)
                            .setLabel('5⭐')
                            .setStyle(feedback.q2 === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q2 && feedback.q2 !== 5)
                    )
            )
            .addActionRowComponents(
                feedback.q2 ? new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`feedback_edit_q2_${ticketId}`)
                            .setLabel('Edit Answer')
                            .setEmoji('✏️')
                            .setStyle(ButtonStyle.Secondary)
                    ) : new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('placeholder_q2')
                            .setLabel('Select a rating above')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ❓ Question 3: How satisfied are you with the solution?`)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`feedback_q3_1_${ticketId}`)
                            .setLabel('1⭐')
                            .setStyle(feedback.q3 === 1 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q3 && feedback.q3 !== 1),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q3_2_${ticketId}`)
                            .setLabel('2⭐')
                            .setStyle(feedback.q3 === 2 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q3 && feedback.q3 !== 2),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q3_3_${ticketId}`)
                            .setLabel('3⭐')
                            .setStyle(feedback.q3 === 3 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q3 && feedback.q3 !== 3),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q3_4_${ticketId}`)
                            .setLabel('4⭐')
                            .setStyle(feedback.q3 === 4 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q3 && feedback.q3 !== 4),
                        new ButtonBuilder()
                            .setCustomId(`feedback_q3_5_${ticketId}`)
                            .setLabel('5⭐')
                            .setStyle(feedback.q3 === 5 ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(!!feedback.q3 && feedback.q3 !== 5)
                    )
            )
            .addActionRowComponents(
                feedback.q3 ? new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`feedback_edit_q3_${ticketId}`)
                            .setLabel('Edit Answer')
                            .setEmoji('✏️')
                            .setStyle(ButtonStyle.Secondary)
                    ) : new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('placeholder_q3')
                            .setLabel('Select a rating above')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*Your feedback helps us improve our support service!*`)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`feedback_skip_${ticketId}`)
                            .setLabel('Skip Feedback')
                            .setEmoji('⏭️')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`feedback_submit_${ticketId}`)
                            .setLabel('Submit & Close')
                            .setEmoji('✅')
                            .setStyle(ButtonStyle.Success)
                    )
            )
    ];
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle button interactions for tickets
        if (interaction.isButton()) {
            const { customId } = interaction;

            // View My Tickets Button
            if (customId === 'view_my_tickets') {
                // Defer reply immediately to prevent timeout
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                } catch (error) {
                    console.error('Failed to defer reply:', error.message);
                    return; // Interaction already expired
                }

                const tickets = await getTicketsByUserId(interaction.guild.id, interaction.user.id);

                if (!tickets.success) {
                    try {
                        return await interaction.editReply({
                            content: '❌ Failed to fetch your tickets. Please try again later.'
                        });
                    } catch (error) {
                        console.error('Failed to edit reply:', error.message);
                        return;
                    }
                }

                const activeTickets = tickets.data.filter(t => t.status === 'open');
                const closedTickets = tickets.data.filter(t => t.status === 'closed');

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📂 Your Tickets')
                    .setDescription(`Here are all your tickets in this server:`)
                    .addFields(
                        {
                            name: '🟢 Active Tickets',
                            value: activeTickets.length > 0
                                ? activeTickets.map(t => `**#${t.ticket_number}** - ${t.category} (<#${t.channel_id}>)`).join('\n')
                                : 'You currently have no active tickets.',
                            inline: false
                        },
                        {
                            name: '📋 Recent Closed Tickets',
                            value: closedTickets.slice(0, 5).length > 0
                                ? closedTickets.slice(0, 5).map(t => `**#${t.ticket_number}** - ${t.category} (Closed <t:${Math.floor(new Date(t.closed_at).getTime() / 1000)}:R>)`).join('\n')
                                : 'No recent ticket history found.',
                            inline: false
                        },
                        {
                            name: '📊 Statistics',
                            value: `**Total Tickets:** ${tickets.data.length}\n**Active:** ${activeTickets.length}\n**Closed:** ${closedTickets.length}`,
                            inline: false
                        }
                    )
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

            // View FAQ Button - Advanced Components v2 System
            else if (customId === 'view_faq') {
                // First time viewing FAQ - defer reply
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                // Build FAQ content for general category (default)
                const faqContent = buildFAQContent('general');

                await interaction.editReply({
                    components: faqContent,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                });
            }

            // FAQ Category Navigation
            else if (customId.startsWith('faq_category_')) {
                // Navigating between categories - defer update to edit existing message
                await interaction.deferUpdate();

                // Determine which category to show
                const category = customId.split('_')[2];

                // Build FAQ content based on category
                const faqContent = buildFAQContent(category);

                await interaction.editReply({
                    components: faqContent,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                });
            }

            // Documentation Button
            else if (customId === 'ticket_documentation') {
                await interaction.reply({
                    content: '🚧 **Feature Under Construction**\n\nThe documentation feature is currently under construction and will be available soon!\n\nStay tuned for updates! 📚',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Status Page Button
            else if (customId === 'ticket_status') {
                await interaction.reply({
                    content: '🚧 **Feature Under Construction**\n\nThe status page feature is currently under construction and will be available soon!\n\nStay tuned for updates! 📊',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Close Ticket Button (new system)
            else if (customId === 'ticket_close') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                // Get ticket from database
                const ticket = await getTicketByChannelId(interaction.channel.id);

                if (!ticket.success) {
                    return await interaction.editReply({
                        content: '❌ This is not a valid ticket channel!'
                    });
                }

                // Check permissions
                if (interaction.user.id !== ticket.data.user_id && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.editReply({
                        content: '❌ You can only close your own tickets or you need Manage Channels permission!'
                    });
                }

                // Initialize empty feedback for this ticket
                if (!feedbackResponses.has(ticket.data.id)) {
                    feedbackResponses.set(ticket.data.id, {});
                }

                // Send feedback form using Components v2
                const feedbackForm = buildFeedbackForm(ticket.data.id, ticket.data.ticket_number, {});

                await interaction.editReply({
                    components: feedbackForm,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                });
            }

            // Claim Ticket Button
            else if (customId === 'ticket_claim') {
                // Defer the update FIRST (must be within 3 seconds)
                await interaction.deferUpdate();

                // Get ticket from database
                const ticket = await getTicketByChannelId(interaction.channel.id);

                if (!ticket.success) {
                    return await interaction.followUp({
                        content: '❌ This is not a valid ticket channel!',
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Get ticket config to check if user has support role
                const config = await getTicketConfig(interaction.guild.id);

                if (!config.success || !interaction.member.roles.cache.has(config.data.support_role_id)) {
                    return await interaction.followUp({
                        content: '❌ You need the support role to claim tickets!',
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Update ticket in database
                await claimTicket(interaction.channel.id, interaction.user.id);

                // Send simple claim message
                const claimMessage = [
                    new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## <:92042no:1423565139038175313> Ticket Claimed`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`${interaction.user} has claimed this ticket and will assist you.`)
                        )
                ];

                await interaction.channel.send({
                    components: claimMessage,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                });

                // Update ONLY the button in the original message
                try {
                    // Get the raw JSON data from the message
                    const messageData = interaction.message.toJSON();

                    // Deep clone the components to avoid mutation
                    const updatedComponents = JSON.parse(JSON.stringify(messageData.components));

                    // Find and update only the Claim button
                    for (const container of updatedComponents) {
                        if (container.components) {
                            for (const comp of container.components) {
                                if (comp.type === 1 && comp.components) { // ActionRow
                                    for (const btn of comp.components) {
                                        if (btn.custom_id === 'ticket_claim') {
                                            // Update only this button
                                            btn.custom_id = 'ticket_unclaim';
                                            btn.label = 'Unclaim Ticket';
                                            btn.emoji = { name: '🔓', id: null };
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Edit the message with the updated components
                    await interaction.message.edit({
                        components: updatedComponents,
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                    });
                } catch (error) {
                    console.error('Error updating button:', error);
                }

                console.log(`[TICKET] Ticket #${ticket.data.ticket_number} claimed by ${interaction.user.tag}`);
            }

            // Unclaim Ticket Button
            else if (customId === 'ticket_unclaim') {
                // Defer the update FIRST (must be within 3 seconds)
                await interaction.deferUpdate();

                // Get ticket from database
                const ticket = await getTicketByChannelId(interaction.channel.id);

                if (!ticket.success) {
                    return await interaction.followUp({
                        content: '❌ This is not a valid ticket channel!',
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Check if the user is the one who claimed it
                if (ticket.data.claimed_by !== interaction.user.id) {
                    return await interaction.followUp({
                        content: '❌ Only the staff member who claimed this ticket can unclaim it!',
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Update ticket in database
                await unclaimTicket(interaction.channel.id);

                // Send simple unclaim message
                const unclaimMessage = [
                    new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## <:92042no:1423565139038175313> Ticket Unclaimed`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`${interaction.user} has unclaimed this ticket. It's now available for other staff members.`)
                        )
                ];

                await interaction.channel.send({
                    components: unclaimMessage,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                });

                // Update ONLY the button in the original message
                try {
                    // Get the raw JSON data from the message
                    const messageData = interaction.message.toJSON();

                    // Deep clone the components to avoid mutation
                    const updatedComponents = JSON.parse(JSON.stringify(messageData.components));

                    // Find and update only the Unclaim button
                    for (const container of updatedComponents) {
                        if (container.components) {
                            for (const comp of container.components) {
                                if (comp.type === 1 && comp.components) { // ActionRow
                                    for (const btn of comp.components) {
                                        if (btn.custom_id === 'ticket_unclaim') {
                                            // Update only this button
                                            btn.custom_id = 'ticket_claim';
                                            btn.label = 'Claim Ticket';
                                            btn.emoji = { name: 'management', id: '1423036751747874976' };
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Edit the message with the updated components
                    await interaction.message.edit({
                        components: updatedComponents,
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                    });
                } catch (error) {
                    console.error('Error updating button:', error);
                }

                console.log(`[TICKET] Ticket #${ticket.data.ticket_number} unclaimed by ${interaction.user.tag}`);
            }

            // Feedback Rating Buttons (Q1, Q2, Q3)
            else if (customId.startsWith('feedback_q') && !customId.startsWith('feedback_edit')) {
                // Defer the update immediately to prevent timeout
                await interaction.deferUpdate();

                const parts = customId.split('_');
                const question = parts[1]; // q1, q2, or q3
                const rating = parts[2]; // 1-5
                const ticketId = parts[3];

                // Initialize feedback storage for this ticket if not exists
                if (!feedbackResponses.has(ticketId)) {
                    feedbackResponses.set(ticketId, {});
                }

                // Store the rating
                const feedback = feedbackResponses.get(ticketId);
                feedback[question] = parseInt(rating);
                feedbackResponses.set(ticketId, feedback);

                // Get ticket from database
                const ticket = await getTicketByChannelId(interaction.channel.id);

                // Rebuild the feedback form with updated buttons
                const feedbackForm = buildFeedbackForm(ticket.data.id, ticket.data.ticket_number, feedback);

                // Update the message with new button states
                await interaction.editReply({
                    components: feedbackForm,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                });
            }

            // Edit Feedback Answer Buttons
            else if (customId.startsWith('feedback_edit_')) {
                // Defer the update immediately to prevent timeout
                await interaction.deferUpdate();

                const parts = customId.split('_');
                const question = parts[2]; // q1, q2, or q3
                const ticketId = parts[3];

                // Get feedback and clear the answer for this question
                const feedback = feedbackResponses.get(ticketId) || {};
                delete feedback[question];
                feedbackResponses.set(ticketId, feedback);

                // Get ticket from database
                const ticket = await getTicketByChannelId(interaction.channel.id);

                // Rebuild the feedback form with re-enabled buttons
                const feedbackForm = buildFeedbackForm(ticket.data.id, ticket.data.ticket_number, feedback);

                // Update the message with re-enabled buttons
                await interaction.editReply({
                    components: feedbackForm,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                });
            }

            // Skip Feedback Button
            else if (customId.startsWith('feedback_skip_')) {
                // Defer the reply immediately to prevent timeout
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const ticketId = customId.split('_')[2];

                // Get ticket from database
                const ticket = await getTicketByChannelId(interaction.channel.id);

                if (!ticket.success) {
                    return await interaction.editReply({
                        content: '❌ This is not a valid ticket channel!'
                    });
                }

                // Close ticket in database
                await closeTicket(interaction.channel.id, interaction.user.id);

                // Clean up feedback storage
                feedbackResponses.delete(ticketId);

                // Log skip action
                await logTicketAction(
                    ticket.data.id,
                    interaction.user.id,
                    'feedback_skipped',
                    'User chose to skip feedback'
                );

                // Send closing message
                const closeEmbed = new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('🔒 Ticket Closed')
                    .setDescription('This ticket has been closed without feedback.')
                    .addFields(
                        { name: '👤 Closed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '📅 Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                        { name: '🎫 Ticket Number', value: `#${ticket.data.ticket_number}`, inline: true }
                    )
                    .setFooter({ text: 'This channel will be deleted in 10 seconds...' })
                    .setTimestamp();

                // Delete the feedback message
                try {
                    await interaction.message.delete();
                } catch (err) {
                    // Message already deleted or can't be deleted, that's fine
                    console.log('[TICKET] Feedback message already removed or inaccessible');
                }

                await interaction.channel.send({ embeds: [closeEmbed] });

                // Send transcript to logs channel
                await sendTicketTranscript(interaction.guild, ticket.data, interaction.channel);

                // Delete channel after 10 seconds
                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                        console.log(`[TICKET] Ticket #${ticket.data.ticket_number} closed (feedback skipped) by ${interaction.user.tag}`);
                    } catch (error) {
                        console.error('Error deleting ticket channel:', error);
                    }
                }, 10000);
            }

            // Submit Feedback Button
            else if (customId.startsWith('feedback_submit_')) {
                // Defer the reply immediately to prevent timeout
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const ticketId = customId.split('_')[2];

                // Get ticket from database
                const ticket = await getTicketByChannelId(interaction.channel.id);

                if (!ticket.success) {
                    return await interaction.editReply({
                        content: '❌ This is not a valid ticket channel!'
                    });
                }

                // Get feedback responses
                const feedback = feedbackResponses.get(ticketId) || {};
                const q1 = feedback.q1 || 0;
                const q2 = feedback.q2 || 0;
                const q3 = feedback.q3 || 0;

                // Check if at least one question was answered
                if (q1 === 0 && q2 === 0 && q3 === 0) {
                    return await interaction.editReply({
                        content: '❌ Please rate at least one question before submitting!'
                    });
                }

                // Calculate average rating
                const ratings = [q1, q2, q3].filter(r => r > 0);
                const averageRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);

                // Log feedback to database
                await logTicketAction(
                    ticket.data.id,
                    interaction.user.id,
                    'feedback_submitted',
                    `Response Time: ${q1}⭐, Staff Helpfulness: ${q2}⭐, Solution Satisfaction: ${q3}⭐, Average: ${averageRating}⭐`
                );

                // Close ticket in database
                await closeTicket(interaction.channel.id, interaction.user.id);

                // Clean up feedback storage
                feedbackResponses.delete(ticketId);

                // Send closing message with feedback summary
                const closeEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('✅ Ticket Closed with Feedback')
                    .setDescription('Thank you for your feedback! This helps us improve our support.')
                    .addFields(
                        { name: '⭐ Your Ratings', value: `**Response Time:** ${q1 || 'Not rated'}⭐\n**Staff Helpfulness:** ${q2 || 'Not rated'}⭐\n**Solution Satisfaction:** ${q3 || 'Not rated'}⭐\n**Average:** ${averageRating}⭐`, inline: false },
                        { name: '👤 Closed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '📅 Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                        { name: '🎫 Ticket Number', value: `#${ticket.data.ticket_number}`, inline: true }
                    )
                    .setFooter({ text: 'This channel will be deleted in 15 seconds...' })
                    .setTimestamp();

                // Update the feedback message to show success
                const successMessage = [
                    new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# ✅ Feedback Submitted Successfully!`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`Thank you for taking the time to rate your support experience!`)
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## ⭐ Your Ratings`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `**Response Time:** ${q1 ? '⭐'.repeat(q1) + '⚫'.repeat(5-q1) : '⚫⚫⚫⚫⚫'} (${q1 || 0}/5)\n` +
                                `**Staff Helpfulness:** ${q2 ? '⭐'.repeat(q2) + '⚫'.repeat(5-q2) : '⚫⚫⚫⚫⚫'} (${q2 || 0}/5)\n` +
                                `**Solution Satisfaction:** ${q3 ? '⭐'.repeat(q3) + '⚫'.repeat(5-q3) : '⚫⚫⚫⚫⚫'} (${q3 || 0}/5)\n\n` +
                                `**Average Rating:** ${averageRating}⭐ out of 5.0`
                            )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`*Your feedback helps us improve our support service. This ticket will be closed shortly.*`)
                        )
                ];

                try {
                    await interaction.editReply({
                        content: '✅ Feedback submitted successfully! Thank you!'
                    });
                } catch (err) {
                    console.error('[TICKET] Error sending feedback confirmation:', err);
                }

                // Update the original feedback message
                try {
                    await interaction.message.edit({
                        components: successMessage,
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                    });
                } catch (err) {
                    console.error('[TICKET] Error updating feedback message:', err);
                }

                await interaction.channel.send({ embeds: [closeEmbed] });

                // Send transcript to logs channel
                await sendTicketTranscript(interaction.guild, ticket.data, interaction.channel);

                // Send review to review channel if configured
                const { getTicketConfig } = require('../utils/database');
                const config = await getTicketConfig(interaction.guild.id);

                if (config.success && config.data.review_channel_id) {
                    try {
                        const reviewChannel = await interaction.guild.channels.fetch(config.data.review_channel_id);

                        if (reviewChannel) {
                            // Get ticket creator
                            const ticketCreator = await interaction.client.users.fetch(ticket.data.user_id);

                            // Get claimed by user if exists
                            let claimedByUser = null;
                            if (ticket.data.claimed_by) {
                                try {
                                    claimedByUser = await interaction.client.users.fetch(ticket.data.claimed_by);
                                } catch (error) {
                                    console.error('Error fetching claimed by user:', error);
                                }
                            }

                            // Create star display
                            const getStarDisplay = (rating) => {
                                if (rating === 0) return '⚫⚫⚫⚫⚫ (Not rated)';
                                const filled = '⭐'.repeat(rating);
                                const empty = '⚫'.repeat(5 - rating);
                                return `${filled}${empty} (${rating}/5)`;
                            };

                            // Determine color based on average rating
                            let reviewColor = '#57F287'; // Green for good
                            if (averageRating < 3) reviewColor = '#ED4245'; // Red for poor
                            else if (averageRating < 4) reviewColor = '#FEE75C'; // Yellow for average

                            // Build fields array
                            const fields = [
                                { name: '🎫 Ticket Information', value: `**Ticket #${ticket.data.ticket_number}**\n**Category:** ${ticket.data.category}\n**Created:** <t:${Math.floor(new Date(ticket.data.created_at).getTime() / 1000)}:R>`, inline: false },
                                { name: '👤 Customer', value: `${ticketCreator.tag}\n${ticketCreator}`, inline: true }
                            ];

                            // Add claimed by if exists
                            if (claimedByUser) {
                                fields.push({ name: '🎯 Claimed By', value: `${claimedByUser.tag}\n${claimedByUser}`, inline: true });
                            }

                            // Add closed by
                            fields.push({ name: '🔒 Closed By', value: `${interaction.user.tag}\n${interaction.user}`, inline: true });

                            // Add empty field for spacing if claimed by exists (to keep layout nice)
                            if (!claimedByUser) {
                                fields.push({ name: '\u200b', value: '\u200b', inline: true });
                            }

                            // Add ratings
                            fields.push(
                                { name: '⏱️ Response Time Rating', value: getStarDisplay(q1), inline: false },
                                { name: '👥 Staff Helpfulness Rating', value: getStarDisplay(q2), inline: false },
                                { name: '✅ Solution Satisfaction Rating', value: getStarDisplay(q3), inline: false },
                                { name: '📈 Average Rating', value: `**${averageRating}⭐** out of 5.0`, inline: false }
                            );

                            const reviewEmbed = new EmbedBuilder()
                                .setColor(reviewColor)
                                .setTitle('📊 New Ticket Feedback Received')
                                .setDescription(`A ticket has been closed with customer feedback.`)
                                .addFields(fields)
                                .setThumbnail(ticketCreator.displayAvatarURL({ dynamic: true }))
                                .setFooter({ text: `Ticket ID: ${ticket.data.id}` })
                                .setTimestamp();

                            await reviewChannel.send({ embeds: [reviewEmbed] });
                        }
                    } catch (error) {
                        console.error('Error sending review to review channel:', error);
                    }
                }

                // Delete channel after 15 seconds (more time to read feedback)
                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                        console.log(`[TICKET] Ticket #${ticket.data.ticket_number} closed with feedback (avg: ${averageRating}⭐) by ${interaction.user.tag}`);
                    } catch (error) {
                        console.error('Error deleting ticket channel:', error);
                    }
                }, 15000);
            }
        }

        // Handle select menu interactions for tickets
        else if (interaction.isStringSelectMenu()) {
            const { customId, values } = interaction;

            // Ticket Category Select Menu
            if (customId === 'ticket_category') {
                // Defer reply immediately to prevent timeout
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                } catch (error) {
                    console.error('Failed to defer reply:', error.message);
                    return; // Interaction already expired
                }

                const category = values[0];

                // Handle cancel option
                if (category === 'cancel') {
                    try {
                        return await interaction.editReply({
                            content: '❌ **Action Canceled**\n\nTicket creation has been canceled.'
                        });
                    } catch (error) {
                        console.error('Failed to edit reply:', error.message);
                        return;
                    }
                }

                const categoryNames = {
                    'tech_support': 'Technical Support',
                    'billing': 'Billing & Payments',
                    'general': 'General Question',
                    'other': 'Other Issue'
                };

                const categoryEmojis = {
                    'tech_support': '🛠️',
                    'billing': '💰',
                    'general': '❓',
                    'other': '📝'
                };

                // Get ticket configuration
                const config = await getTicketConfig(interaction.guild.id);

                if (!config.success) {
                    return await interaction.editReply({
                        content: '❌ Ticket system is not configured! Please ask an administrator to run `/setup-ticket` first.'
                    });
                }

                // Get the category channel
                const ticketCategory = await interaction.guild.channels.fetch(config.data.category_id).catch(() => null);

                if (!ticketCategory) {
                    return await interaction.editReply({
                        content: '❌ Ticket category not found! Please ask an administrator to reconfigure the ticket system.'
                    });
                }

                // Get support role
                const supportRole = await interaction.guild.roles.fetch(config.data.support_role_id).catch(() => null);

                if (!supportRole) {
                    return await interaction.editReply({
                        content: '❌ Support role not found! Please ask an administrator to reconfigure the ticket system.'
                    });
                }

                try {
                    // Create ticket channel
                    const ticketChannel = await interaction.guild.channels.create({
                        name: `🎫│${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        parent: ticketCategory.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles,
                                    PermissionFlagsBits.EmbedLinks
                                ]
                            },
                            {
                                id: supportRole.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles,
                                    PermissionFlagsBits.EmbedLinks,
                                    PermissionFlagsBits.ManageMessages
                                ]
                            }
                        ]
                    });

                    // Create ticket panel message using Components v2
                    const ticketPanel = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`# <:828044ticket:1422650891864903690> ${categoryNames[category]} Ticket`)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`Welcome <@${interaction.user.id}>! Thank you for creating a ticket.\n\n**Support Team:** <@&${supportRole.id}> has been notified and will assist you shortly.`)
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`## <:559950clipboard:1422650888186495109> Ticket Information`)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `**Category:** ${categoryEmojis[category]} ${categoryNames[category]}\n` +
                                    `**Created By:** ${interaction.user.tag}\n` +
                                    `**Status:** <:828044online:1422650891864903692> Open\n` +
                                    `**Support Team:** ${supportRole}`
                                )
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`## <:29561settings:1423036767396691998> Ticket Actions`)
                            )
                    ];

                    // Build action buttons based on config
                    const actionButtons = [
                        new ButtonBuilder()
                            .setCustomId('ticket_close')
                            .setLabel('Close Ticket')
                            .setEmoji({ name: 'voicechannellocked', id: '1423036759998205982' })
                            .setStyle(ButtonStyle.Secondary)
                    ];

                    // Add claim button only if enabled in config
                    if (config.data.enable_claim !== false) { // Default to true if not set
                        actionButtons.push(
                            new ButtonBuilder()
                                .setCustomId('ticket_claim')
                                .setLabel('Claim Ticket')
                                .setEmoji({ name: 'management', id: '1423036751747874976' })
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }

                    ticketPanel[0]
                        .addActionRowComponents(
                            new ActionRowBuilder().addComponents(...actionButtons)
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`*Please be patient. Our support team will assist you as soon as possible.*`)
                        );

                    const panelMessage = await ticketChannel.send({
                        components: ticketPanel,
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
                    });

                    // Save ticket to database
                    const ticketData = await createTicket({
                        guildId: interaction.guild.id,
                        channelId: ticketChannel.id,
                        userId: interaction.user.id,
                        username: interaction.user.username,
                        category: category,
                        panelMessageId: panelMessage.id
                    });

                    if (ticketData.success) {
                        // Save only the initial panel message to database
                        await saveTicketMessage(ticketData.data.id, panelMessage.id);
                    }

                    // Reply to user with embed
                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('<:828044ticket:1422650891864903690> Ticket Created Successfully!')
                        .setDescription(`Your support ticket has been created. Our team will assist you shortly.`)
                        .addFields(
                            {
                                name: '<:828044info:1422650891864903691> Ticket Details',
                                value: `**Ticket Number:** #${ticketData.data?.ticket_number || 'N/A'}\n` +
                                       `**Category:** ${categoryEmojis[category]} ${categoryNames[category]}\n` +
                                       `**Status:** <:828044online:1422650891864903692> Open`,
                                inline: false
                            },
                            {
                                name: '<:828044chat:1422650891864903693> Your Ticket Channel',
                                value: `${ticketChannel}\n\nClick the channel above to view your ticket.`,
                                inline: false
                            },
                            {
                                name: '<:29561settings:1423036767396691998> Next Steps',
                                value: `**1.** Go to your ticket channel\n` +
                                       `**2.** Describe your issue in detail\n` +
                                       `**3.** Wait for our support team to respond\n` +
                                       `**4.** Use the buttons to manage your ticket`,
                                inline: false
                            }
                        )
                        .setFooter({ text: `Ticket created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [successEmbed] });

                    console.log(`[TICKET] ${interaction.user.tag} created ticket #${ticketData.data?.ticket_number} in category: ${category}`);

                } catch (error) {
                    console.error('Error creating ticket channel:', error);
                    await interaction.editReply({
                        content: '❌ Failed to create ticket channel. Please contact an administrator.'
                    });
                }
            }
        }
    },
};

