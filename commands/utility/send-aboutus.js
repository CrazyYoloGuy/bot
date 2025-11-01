const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send-aboutus')
        .setDescription('Send a beautiful About Us message with interactive components')
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

        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        // Message 1: Main About Us with Services
        const mainMessage = [
            new ContainerBuilder()
                // Hero Header
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# 💻 ${guild.name}`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*Professional Development Solutions | Custom Discord Bots • Websites • Applications*`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )

                // Who We Are Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🎯 Who We Are`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `We are a team of **experienced developers** specializing in creating high-quality, custom solutions for businesses and communities. From Discord bots to full-stack web applications, we bring your ideas to life with clean code, modern design, and reliable performance.`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                )

                // Services Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🛠️ Our Services`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Click below to learn more about each service:**`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('🤖 Discord Bots')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('service_bots'),
                            new ButtonBuilder()
                                .setLabel('🌐 Websites')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('service_websites'),
                            new ButtonBuilder()
                                .setLabel('📱 Applications')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('service_apps')
                        )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('🎨 UI/UX Design')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('service_design'),
                            new ButtonBuilder()
                                .setLabel('🔧 Maintenance')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('service_maintenance'),
                            new ButtonBuilder()
                                .setLabel('💡 Consulting')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('service_consulting')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )

                // Why Choose Us Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ⭐ Why Choose Us?`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `✅ **Professional Quality** - Enterprise-grade code and design standards\n` +
                        `⚡ **Fast Delivery** - Quick turnaround times without compromising quality\n` +
                        `💬 **24/7 Support** - Always available to help with your project\n` +
                        `🔒 **Secure & Reliable** - Built with security and performance in mind\n` +
                        `💰 **Competitive Pricing** - Affordable rates for premium services\n` +
                        `🎯 **Custom Solutions** - Tailored to your specific needs and requirements`
                    )
                )
        ];

        // Message 2: Process & Contact
        const processMessage = [
            new ContainerBuilder()
                // Process Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 📋 Our Process`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Simple, transparent, and efficient workflow:**`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('1️⃣ Consultation')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('process_consultation'),
                            new ButtonBuilder()
                                .setLabel('2️⃣ Planning')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('process_planning'),
                            new ButtonBuilder()
                                .setLabel('3️⃣ Development')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('process_development')
                        )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('4️⃣ Testing')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('process_testing'),
                            new ButtonBuilder()
                                .setLabel('5️⃣ Delivery')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('process_delivery'),
                            new ButtonBuilder()
                                .setLabel('6️⃣ Support')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('process_support')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
                )

                // Contact Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 💰 Ready to Start Your Project?`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Get a **free quote** for your project! We offer flexible pricing plans to fit any budget. Whether you need a simple bot or a complex web application, we've got you covered.`
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('💬 Request Quote')
                                .setStyle(ButtonStyle.Success)
                                .setCustomId('aboutus_quote'),
                            new ButtonBuilder()
                                .setLabel('💰 View Pricing')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('aboutus_pricing'),
                            new ButtonBuilder()
                                .setLabel('📞 Contact Us')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('aboutus_contact')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
                )

                // Resources Section
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 📚 Resources & Community`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('💼 Portfolio')
                                .setStyle(ButtonStyle.Success)
                                .setCustomId('aboutus_portfolio'),
                            new ButtonBuilder()
                                .setLabel('👥 Our Team')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('aboutus_team'),
                            new ButtonBuilder()
                                .setLabel('⭐ Reviews')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('aboutus_reviews')
                        )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('❓ FAQ')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('aboutus_faq'),
                            new ButtonBuilder()
                                .setLabel('🎓 Tutorials')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('aboutus_tutorials'),
                            new ButtonBuilder()
                                .setLabel('🚀 Get Started')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('aboutus_getstarted')
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )

                // Footer
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*🚀 Transforming ideas into reality, one line of code at a time.*`)
                )
        ];

        try {
            // Send both messages
            await interaction.channel.send({
                components: mainMessage,
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });

            await interaction.channel.send({
                components: processMessage,
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });

            // Send success confirmation
            await interaction.editReply({
                content: '✅ About Us messages have been sent successfully!',
                ephemeral: true
            });

        } catch (error) {
            console.error('Error sending About Us message:', error);
            await interaction.editReply({
                content: '❌ Failed to send About Us message. Please try again.',
                ephemeral: true
            });
        }
    },
};

