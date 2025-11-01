const { Events, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle button interactions for About Us
        if (interaction.isButton()) {
            const { customId } = interaction;

            // Check if it's an About Us or Service button
            if (customId.startsWith('aboutus_') || customId.startsWith('service_') || customId.startsWith('process_')) {
                let embed;

                // About Us Buttons
                if (customId === 'aboutus_getstarted') {
                    embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('🚀 Get Started')
                        .setDescription(
                            '**Ready to bring your project to life?**\n\n' +
                            '**Here\'s how to get started:**\n\n' +
                            '**1. Choose Your Service**\n' +
                            '• Discord Bot Development\n' +
                            '• Website Development\n' +
                            '• Custom Applications\n' +
                            '• UI/UX Design\n\n' +
                            '**2. Contact Us**\n' +
                            '• Open a ticket in our support channel\n' +
                            '• DM a staff member\n' +
                            '• Fill out our contact form\n\n' +
                            '**3. Free Consultation**\n' +
                            '• Discuss your project requirements\n' +
                            '• Get expert advice and recommendations\n' +
                            '• Receive a detailed quote\n\n' +
                            '**4. Project Kickoff**\n' +
                            '• Agree on timeline and deliverables\n' +
                            '• Make initial payment\n' +
                            '• We start building your project!\n\n' +
                            '💡 **No commitment required for consultation!**'
                        )
                        .setFooter({ text: 'Let\'s build something amazing together!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_portfolio') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('💼 Our Portfolio')
                        .setDescription(
                            '**Check out our previous work!**\n\n' +
                            '**🤖 Discord Bots**\n' +
                            '• Advanced moderation systems\n' +
                            '• Custom economy & leveling bots\n' +
                            '• Ticket & support systems\n' +
                            '• Music & entertainment bots\n' +
                            '• Integration bots (APIs, databases)\n\n' +
                            '**🌐 Websites**\n' +
                            '• E-commerce platforms\n' +
                            '• Portfolio & business websites\n' +
                            '• Community dashboards\n' +
                            '• Landing pages & marketing sites\n' +
                            '• Full-stack web applications\n\n' +
                            '**📱 Applications**\n' +
                            '• Desktop applications\n' +
                            '• Mobile apps (iOS & Android)\n' +
                            '• API development\n' +
                            '• Database solutions\n' +
                            '• Automation tools\n\n' +
                            '**📊 Stats:**\n' +
                            '✅ 100+ Projects Completed\n' +
                            '⭐ 5-Star Average Rating\n' +
                            '😊 98% Client Satisfaction\n\n' +
                            '🔗 **Visit our website to see live examples!**'
                        )
                        .setFooter({ text: 'Your project could be next!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_team') {
                    embed = new EmbedBuilder()
                        .setColor('#9B59B6')
                        .setTitle('👥 Meet Our Team')
                        .setDescription(
                            '**Experienced developers passionate about quality**\n\n' +
                            '**💻 Lead Developers**\n' +
                            '• 5+ years of professional experience\n' +
                            '• Specialized in Discord.js, React, Node.js\n' +
                            '• Full-stack development expertise\n\n' +
                            '**🎨 UI/UX Designers**\n' +
                            '• Modern, user-friendly designs\n' +
                            '• Responsive & accessible interfaces\n' +
                            '• Brand identity & graphics\n\n' +
                            '**🛡️ Quality Assurance**\n' +
                            '• Rigorous testing procedures\n' +
                            '• Bug-free delivery guarantee\n' +
                            '• Performance optimization\n\n' +
                            '**💬 Support Team**\n' +
                            '• 24/7 availability\n' +
                            '• Quick response times\n' +
                            '• Ongoing maintenance & updates\n\n' +
                            '**🌍 Global Team**\n' +
                            'We work across multiple time zones to ensure your project never sleeps!'
                        )
                        .setFooter({ text: 'A dedicated team for your success!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_quote') {
                    embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('💬 Request a Quote')
                        .setDescription(
                            '**Get a free, no-obligation quote for your project!**\n\n' +
                            '**📝 What We Need:**\n' +
                            '• Project description & goals\n' +
                            '• Required features & functionality\n' +
                            '• Timeline & deadline (if any)\n' +
                            '• Budget range (optional)\n\n' +
                            '**📞 How to Request:**\n' +
                            '1. Open a ticket in our support channel\n' +
                            '2. Provide project details\n' +
                            '3. Our team will review within 24 hours\n' +
                            '4. Receive detailed quote & timeline\n\n' +
                            '**💰 What\'s Included:**\n' +
                            '✅ Detailed cost breakdown\n' +
                            '✅ Project timeline & milestones\n' +
                            '✅ Feature specifications\n' +
                            '✅ Payment terms & options\n' +
                            '✅ Free revisions policy\n\n' +
                            '**⚡ Average Response Time: 12-24 hours**\n\n' +
                            '💡 **Tip:** The more details you provide, the more accurate your quote will be!'
                        )
                        .setFooter({ text: 'No commitment required!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_pricing') {
                    embed = new EmbedBuilder()
                        .setColor('#FEE75C')
                        .setTitle('💰 Pricing Information')
                        .setDescription(
                            '**Transparent, competitive pricing for quality work**\n\n' +
                            '**🤖 Discord Bots**\n' +
                            '• Basic Bot: Starting at $50\n' +
                            '• Advanced Bot: Starting at $150\n' +
                            '• Enterprise Bot: Starting at $500+\n\n' +
                            '**🌐 Websites**\n' +
                            '• Landing Page: Starting at $100\n' +
                            '• Business Website: Starting at $300\n' +
                            '• E-commerce: Starting at $800+\n' +
                            '• Web App: Starting at $1,000+\n\n' +
                            '**📱 Applications**\n' +
                            '• Desktop App: Starting at $400\n' +
                            '• Mobile App: Starting at $1,000\n' +
                            '• API Development: Starting at $300\n\n' +
                            '**🎨 Design Services**\n' +
                            '• Logo Design: Starting at $50\n' +
                            '• UI/UX Design: Starting at $200\n' +
                            '• Complete Branding: Starting at $500\n\n' +
                            '**🔧 Maintenance & Support**\n' +
                            '• Monthly: $50-200/month\n' +
                            '• Yearly: $500-2,000/year\n\n' +
                            '**💡 Notes:**\n' +
                            '• Prices vary based on complexity\n' +
                            '• Custom quotes for unique projects\n' +
                            '• Discounts for long-term contracts\n' +
                            '• Flexible payment plans available'
                        )
                        .setFooter({ text: 'Contact us for a detailed quote!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_contact') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('📞 Contact Us')
                        .setDescription(
                            '**We\'re here to help! Reach out anytime.**\n\n' +
                            '**💬 Discord Support**\n' +
                            '• Open a ticket (Recommended)\n' +
                            '• DM a staff member\n' +
                            '• Ask in support channels\n\n' +
                            '**📧 Email**\n' +
                            '• General: contact@example.com\n' +
                            '• Sales: sales@example.com\n' +
                            '• Support: support@example.com\n\n' +
                            '**🌐 Website**\n' +
                            '• Live chat available\n' +
                            '• Contact form\n' +
                            '• Knowledge base\n\n' +
                            '**⏰ Response Times:**\n' +
                            '• Discord: Under 1 hour\n' +
                            '• Email: 12-24 hours\n' +
                            '• Emergency: Immediate\n\n' +
                            '**🌍 Available 24/7**\n' +
                            'Our global team ensures someone is always available to help!'
                        )
                        .setFooter({ text: 'We look forward to hearing from you!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_reviews') {
                    embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('⭐ Client Reviews')
                        .setDescription(
                            '**See what our clients say about us!**\n\n' +
                            '**⭐⭐⭐⭐⭐ "Exceptional Work!"**\n' +
                            '*"The team delivered exactly what I needed. Professional, fast, and high quality. Highly recommend!"*\n' +
                            '— John D., Discord Bot Client\n\n' +
                            '**⭐⭐⭐⭐⭐ "Best Investment Ever"**\n' +
                            '*"My website looks amazing and works perfectly. Worth every penny!"*\n' +
                            '— Sarah M., Website Client\n\n' +
                            '**⭐⭐⭐⭐⭐ "Outstanding Support"**\n' +
                            '*"Not only did they build a great bot, but their ongoing support is incredible."*\n' +
                            '— Mike R., Bot & Maintenance Client\n\n' +
                            '**⭐⭐⭐⭐⭐ "Exceeded Expectations"**\n' +
                            '*"They took my vague idea and turned it into something amazing. Very creative team!"*\n' +
                            '— Emily K., Custom App Client\n\n' +
                            '**📊 Overall Rating: 4.9/5.0**\n' +
                            '✅ 100+ Satisfied Clients\n' +
                            '✅ 98% Would Recommend\n' +
                            '✅ 95% Repeat Customers'
                        )
                        .setFooter({ text: 'Your review could be next!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_faq') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('❓ Frequently Asked Questions')
                        .setDescription(
                            '**Quick answers to common questions**\n\n' +
                            '**Q: How long does a project take?**\n' +
                            'A: Simple bots: 3-7 days. Websites: 1-3 weeks. Complex projects: 1-3 months.\n\n' +
                            '**Q: Do you offer refunds?**\n' +
                            'A: Yes! If we can\'t deliver what was promised, you get a full refund.\n\n' +
                            '**Q: Can I request changes after delivery?**\n' +
                            'A: Absolutely! We include free revisions with every project.\n\n' +
                            '**Q: Do you provide source code?**\n' +
                            'A: Yes, you receive full source code and documentation.\n\n' +
                            '**Q: What payment methods do you accept?**\n' +
                            'A: PayPal, Stripe, Crypto, and bank transfers.\n\n' +
                            '**Q: Do you sign NDAs?**\n' +
                            'A: Yes, we\'re happy to sign NDAs for confidential projects.\n\n' +
                            '**Q: Can you maintain my existing project?**\n' +
                            'A: Yes! We offer maintenance for projects built by others.\n\n' +
                            '**Q: Do you offer hosting?**\n' +
                            'A: We can recommend hosting or manage it for you.\n\n' +
                            '**Still have questions? Open a ticket!**'
                        )
                        .setFooter({ text: 'We\'re here to help!' })
                        .setTimestamp();
                }
                else if (customId === 'aboutus_tutorials') {
                    embed = new EmbedBuilder()
                        .setColor('#9B59B6')
                        .setTitle('🎓 Tutorials & Resources')
                        .setDescription(
                            '**Learn from our expertise!**\n\n' +
                            '**📚 Free Resources:**\n' +
                            '• Discord.js guides & tutorials\n' +
                            '• Web development best practices\n' +
                            '• Code snippets & examples\n' +
                            '• Video tutorials\n\n' +
                            '**🎯 Topics Covered:**\n' +
                            '• Bot development basics\n' +
                            '• Advanced Discord features\n' +
                            '• Database integration\n' +
                            '• API development\n' +
                            '• Frontend frameworks\n' +
                            '• Backend architecture\n\n' +
                            '**💡 Learning Paths:**\n' +
                            '1. Beginner: Start with basics\n' +
                            '2. Intermediate: Build projects\n' +
                            '3. Advanced: Master techniques\n\n' +
                            '**🌐 Where to Find:**\n' +
                            '• Our documentation website\n' +
                            '• YouTube channel\n' +
                            '• GitHub repositories\n' +
                            '• Discord community channels\n\n' +
                            '**🎁 Bonus:** Premium clients get exclusive tutorials!'
                        )
                        .setFooter({ text: 'Knowledge is power!' })
                        .setTimestamp();
                }

                // Service Buttons
                else if (customId === 'service_bots') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('🤖 Discord Bot Development')
                        .setDescription(
                            '**Custom Discord bots tailored to your needs**\n\n' +
                            '**✨ What We Build:**\n' +
                            '• Moderation & Auto-Mod Systems\n' +
                            '• Ticket & Support Systems\n' +
                            '• Economy & Leveling Bots\n' +
                            '• Music & Entertainment Bots\n' +
                            '• Custom Commands & Features\n' +
                            '• API Integrations\n' +
                            '• Database Management\n' +
                            '• Dashboard Interfaces\n\n' +
                            '**🔧 Technologies:**\n' +
                            '• Discord.js v14 (Latest)\n' +
                            '• Node.js & TypeScript\n' +
                            '• MongoDB, PostgreSQL, MySQL\n' +
                            '• Redis for caching\n' +
                            '• RESTful APIs\n\n' +
                            '**📦 What You Get:**\n' +
                            '✅ Fully functional bot\n' +
                            '✅ Source code & documentation\n' +
                            '✅ Hosting setup assistance\n' +
                            '✅ Free updates for 30 days\n' +
                            '✅ Lifetime support option\n\n' +
                            '**💰 Starting at $50**'
                        )
                        .setFooter({ text: 'Let\'s build your perfect bot!' })
                        .setTimestamp();
                }
                else if (customId === 'service_websites') {
                    embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('🌐 Website Development')
                        .setDescription(
                            '**Modern, responsive websites that convert**\n\n' +
                            '**✨ What We Build:**\n' +
                            '• Business & Portfolio Sites\n' +
                            '• E-commerce Platforms\n' +
                            '• Landing Pages\n' +
                            '• Community Dashboards\n' +
                            '• Web Applications\n' +
                            '• Admin Panels\n' +
                            '• Blog & CMS Systems\n' +
                            '• API Backends\n\n' +
                            '**🔧 Technologies:**\n' +
                            '• React, Next.js, Vue.js\n' +
                            '• Node.js, Express\n' +
                            '• Tailwind CSS, Bootstrap\n' +
                            '• MongoDB, PostgreSQL\n' +
                            '• AWS, Vercel, Netlify\n\n' +
                            '**📦 What You Get:**\n' +
                            '✅ Responsive design (mobile-friendly)\n' +
                            '✅ SEO optimized\n' +
                            '✅ Fast loading speeds\n' +
                            '✅ Secure & scalable\n' +
                            '✅ Analytics integration\n' +
                            '✅ Free SSL certificate\n\n' +
                            '**💰 Starting at $100**'
                        )
                        .setFooter({ text: 'Your online presence starts here!' })
                        .setTimestamp();
                }
                else if (customId === 'service_apps') {
                    embed = new EmbedBuilder()
                        .setColor('#9B59B6')
                        .setTitle('📱 Application Development')
                        .setDescription(
                            '**Custom applications for any platform**\n\n' +
                            '**✨ What We Build:**\n' +
                            '• Desktop Applications (Windows, Mac, Linux)\n' +
                            '• Mobile Apps (iOS & Android)\n' +
                            '• Cross-platform Solutions\n' +
                            '• API Development\n' +
                            '• Automation Tools\n' +
                            '• Data Processing Systems\n' +
                            '• Integration Solutions\n' +
                            '• Custom Software\n\n' +
                            '**🔧 Technologies:**\n' +
                            '• Electron, Tauri\n' +
                            '• React Native, Flutter\n' +
                            '• Python, Java, C#\n' +
                            '• REST & GraphQL APIs\n' +
                            '• Cloud services (AWS, Azure, GCP)\n\n' +
                            '**📦 What You Get:**\n' +
                            '✅ Native performance\n' +
                            '✅ Cross-platform compatibility\n' +
                            '✅ Intuitive user interface\n' +
                            '✅ Secure data handling\n' +
                            '✅ Auto-update system\n' +
                            '✅ Comprehensive documentation\n\n' +
                            '**💰 Starting at $400**'
                        )
                        .setFooter({ text: 'Powerful applications, simplified!' })
                        .setTimestamp();
                }
                else if (customId === 'service_design') {
                    embed = new EmbedBuilder()
                        .setColor('#E91E63')
                        .setTitle('🎨 UI/UX Design Services')
                        .setDescription(
                            '**Beautiful, user-friendly designs**\n\n' +
                            '**✨ What We Design:**\n' +
                            '• Website UI/UX\n' +
                            '• Mobile App Interfaces\n' +
                            '• Dashboard Designs\n' +
                            '• Logo & Branding\n' +
                            '• Discord Server Layouts\n' +
                            '• Marketing Materials\n' +
                            '• Infographics\n' +
                            '• Social Media Graphics\n\n' +
                            '**🎯 Our Approach:**\n' +
                            '• User-centered design\n' +
                            '• Modern aesthetics\n' +
                            '• Accessibility focused\n' +
                            '• Brand consistency\n' +
                            '• Responsive layouts\n\n' +
                            '**🔧 Tools We Use:**\n' +
                            '• Figma, Adobe XD\n' +
                            '• Photoshop, Illustrator\n' +
                            '• Sketch, InVision\n\n' +
                            '**📦 What You Get:**\n' +
                            '✅ High-fidelity mockups\n' +
                            '✅ Interactive prototypes\n' +
                            '✅ Design system & guidelines\n' +
                            '✅ All source files\n' +
                            '✅ Unlimited revisions\n\n' +
                            '**💰 Starting at $50**'
                        )
                        .setFooter({ text: 'Design that makes an impact!' })
                        .setTimestamp();
                }
                else if (customId === 'service_maintenance') {
                    embed = new EmbedBuilder()
                        .setColor('#FEE75C')
                        .setTitle('🔧 Maintenance & Support')
                        .setDescription(
                            '**Keep your projects running smoothly**\n\n' +
                            '**✨ What We Offer:**\n' +
                            '• 24/7 Monitoring\n' +
                            '• Bug Fixes & Updates\n' +
                            '• Performance Optimization\n' +
                            '• Security Patches\n' +
                            '• Feature Additions\n' +
                            '• Database Management\n' +
                            '• Backup & Recovery\n' +
                            '• Technical Support\n\n' +
                            '**📋 Plans Available:**\n' +
                            '**Basic:** $50/month\n' +
                            '• Monthly updates\n' +
                            '• Bug fixes\n' +
                            '• Email support\n\n' +
                            '**Pro:** $100/month\n' +
                            '• Weekly updates\n' +
                            '• Priority support\n' +
                            '• Performance monitoring\n\n' +
                            '**Enterprise:** $200/month\n' +
                            '• Daily monitoring\n' +
                            '• 24/7 support\n' +
                            '• Custom features\n\n' +
                            '**💡 Why Maintenance Matters:**\n' +
                            '• Prevent downtime\n' +
                            '• Stay secure\n' +
                            '• Improve performance\n' +
                            '• Peace of mind'
                        )
                        .setFooter({ text: 'We\'ve got your back!' })
                        .setTimestamp();
                }
                else if (customId === 'service_consulting') {
                    embed = new EmbedBuilder()
                        .setColor('#00BCD4')
                        .setTitle('💡 Development Consulting')
                        .setDescription(
                            '**Expert advice for your tech projects**\n\n' +
                            '**✨ What We Help With:**\n' +
                            '• Project Planning & Architecture\n' +
                            '• Technology Stack Selection\n' +
                            '• Code Review & Optimization\n' +
                            '• Security Audits\n' +
                            '• Performance Analysis\n' +
                            '• Scalability Planning\n' +
                            '• Team Training\n' +
                            '• Technical Documentation\n\n' +
                            '**🎯 Who It\'s For:**\n' +
                            '• Startups planning their MVP\n' +
                            '• Businesses scaling up\n' +
                            '• Developers seeking guidance\n' +
                            '• Teams needing code review\n\n' +
                            '**📋 Consultation Process:**\n' +
                            '1. Initial assessment (Free)\n' +
                            '2. Detailed analysis\n' +
                            '3. Recommendations report\n' +
                            '4. Implementation guidance\n' +
                            '5. Follow-up support\n\n' +
                            '**📦 What You Get:**\n' +
                            '✅ Expert recommendations\n' +
                            '✅ Detailed documentation\n' +
                            '✅ Action plan\n' +
                            '✅ Best practices guide\n' +
                            '✅ Ongoing support\n\n' +
                            '**💰 Starting at $100/hour**'
                        )
                        .setFooter({ text: 'Smart decisions start here!' })
                        .setTimestamp();
                }

                // Process Buttons
                else if (customId === 'process_consultation') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('1️⃣ Consultation Phase')
                        .setDescription(
                            '**Understanding your vision**\n\n' +
                            '**What Happens:**\n' +
                            '• Free initial consultation\n' +
                            '• Discuss your project goals\n' +
                            '• Understand requirements\n' +
                            '• Answer your questions\n' +
                            '• Provide expert recommendations\n\n' +
                            '**What We Need:**\n' +
                            '• Project description\n' +
                            '• Target audience\n' +
                            '• Key features needed\n' +
                            '• Timeline expectations\n' +
                            '• Budget range\n\n' +
                            '**Duration:** 30-60 minutes\n' +
                            '**Cost:** FREE\n\n' +
                            '💡 **Tip:** Come prepared with examples of what you like!'
                        )
                        .setFooter({ text: 'Step 1 of 6' })
                        .setTimestamp();
                }
                else if (customId === 'process_planning') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('2️⃣ Planning Phase')
                        .setDescription(
                            '**Creating the blueprint**\n\n' +
                            '**What Happens:**\n' +
                            '• Detailed project specification\n' +
                            '• Feature breakdown\n' +
                            '• Technology stack selection\n' +
                            '• Timeline & milestones\n' +
                            '• Cost estimation\n\n' +
                            '**Deliverables:**\n' +
                            '• Project proposal document\n' +
                            '• Wireframes/mockups\n' +
                            '• Technical architecture\n' +
                            '• Development roadmap\n' +
                            '• Final quote\n\n' +
                            '**Duration:** 2-5 days\n' +
                            '**Your Input:** Review & approve plan\n\n' +
                            '💡 **Tip:** This is the time to request changes!'
                        )
                        .setFooter({ text: 'Step 2 of 6' })
                        .setTimestamp();
                }
                else if (customId === 'process_development') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('3️⃣ Development Phase')
                        .setDescription(
                            '**Building your project**\n\n' +
                            '**What Happens:**\n' +
                            '• Code development begins\n' +
                            '• Regular progress updates\n' +
                            '• Feature implementation\n' +
                            '• Internal testing\n' +
                            '• Code documentation\n\n' +
                            '**Communication:**\n' +
                            '• Weekly progress reports\n' +
                            '• Demo sessions\n' +
                            '• Quick feedback loops\n' +
                            '• Always available for questions\n\n' +
                            '**Duration:** Varies by project\n' +
                            '• Simple: 3-7 days\n' +
                            '• Medium: 1-3 weeks\n' +
                            '• Complex: 1-3 months\n\n' +
                            '💡 **Tip:** We keep you updated every step of the way!'
                        )
                        .setFooter({ text: 'Step 3 of 6' })
                        .setTimestamp();
                }
                else if (customId === 'process_testing') {
                    embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('4️⃣ Testing Phase')
                        .setDescription(
                            '**Ensuring quality & reliability**\n\n' +
                            '**What Happens:**\n' +
                            '• Comprehensive testing\n' +
                            '• Bug identification & fixes\n' +
                            '• Performance optimization\n' +
                            '• Security checks\n' +
                            '• User acceptance testing\n\n' +
                            '**Testing Types:**\n' +
                            '• Functionality testing\n' +
                            '• Performance testing\n' +
                            '• Security testing\n' +
                            '• Compatibility testing\n' +
                            '• User experience testing\n\n' +
                            '**Your Role:**\n' +
                            '• Test the project\n' +
                            '• Report any issues\n' +
                            '• Request adjustments\n' +
                            '• Approve final version\n\n' +
                            '**Duration:** 2-7 days\n\n' +
                            '💡 **Tip:** We don\'t deliver until you\'re 100% satisfied!'
                        )
                        .setFooter({ text: 'Step 4 of 6' })
                        .setTimestamp();
                }
                else if (customId === 'process_delivery') {
                    embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('5️⃣ Delivery Phase')
                        .setDescription(
                            '**Your project is ready!**\n\n' +
                            '**What You Receive:**\n' +
                            '• Complete source code\n' +
                            '• Comprehensive documentation\n' +
                            '• Setup & installation guide\n' +
                            '• Configuration files\n' +
                            '• Database schemas\n' +
                            '• API documentation (if applicable)\n\n' +
                            '**Delivery Methods:**\n' +
                            '• GitHub repository (private)\n' +
                            '• ZIP file download\n' +
                            '• Direct deployment\n\n' +
                            '**Setup Assistance:**\n' +
                            '• Help with hosting setup\n' +
                            '• Configuration guidance\n' +
                            '• Initial deployment\n' +
                            '• Training session\n\n' +
                            '**Ownership:**\n' +
                            '✅ You own all code\n' +
                            '✅ Full commercial rights\n' +
                            '✅ No recurring fees\n\n' +
                            '💡 **Tip:** We help you get everything running smoothly!'
                        )
                        .setFooter({ text: 'Step 5 of 6' })
                        .setTimestamp();
                }
                else if (customId === 'process_support') {
                    embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('6️⃣ Support Phase')
                        .setDescription(
                            '**We\'re here for you!**\n\n' +
                            '**Free Support (30 Days):**\n' +
                            '• Bug fixes\n' +
                            '• Minor adjustments\n' +
                            '• Technical questions\n' +
                            '• Setup assistance\n' +
                            '• Documentation updates\n\n' +
                            '**Extended Support Options:**\n' +
                            '**Monthly:** $50-200/month\n' +
                            '• Ongoing updates\n' +
                            '• Priority support\n' +
                            '• Feature additions\n\n' +
                            '**Lifetime:** One-time fee\n' +
                            '• Unlimited bug fixes\n' +
                            '• Free minor updates\n' +
                            '• Email support\n\n' +
                            '**What We Help With:**\n' +
                            '• Technical issues\n' +
                            '• Feature requests\n' +
                            '• Performance optimization\n' +
                            '• Security updates\n' +
                            '• Scaling assistance\n\n' +
                            '**Response Times:**\n' +
                            '• Critical: Immediate\n' +
                            '• High: Under 4 hours\n' +
                            '• Normal: Under 24 hours\n\n' +
                            '💡 **Tip:** Most clients choose extended support for peace of mind!'
                        )
                        .setFooter({ text: 'Step 6 of 6 - Complete!' })
                        .setTimestamp();
                }

                else {
                    return; // Unknown button
                }

                // Send the embed as an ephemeral reply
                await interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });

                console.log(`[ABOUT US] ${interaction.user.tag} clicked ${customId} button`);
            }
        }
    },
};

