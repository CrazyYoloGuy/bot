const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('my-emoji')
        .setDescription('Create an emoji from your avatar and send it in chat!')
        .addStringOption(option =>
            option.setName('shape')
                .setDescription('Choose the shape of your emoji')
                .setRequired(true)
                .addChoices(
                    { name: '⬜ Square', value: 'square' },
                    { name: '⭕ Circle', value: 'circle' }
                )
        ),

    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const shape = interaction.options.getString('shape');

        try {
            const user = interaction.user;
            const guild = interaction.guild;

            // Check if guild has emoji slots available
            const emojiLimit = guild.premiumTier === 0 ? 50 : guild.premiumTier === 1 ? 100 : guild.premiumTier === 2 ? 150 : 250;
            const currentEmojis = guild.emojis.cache.size;

            if (currentEmojis >= emojiLimit) {
                return await interaction.editReply({
                    content: '❌ This server has reached its emoji limit! Please delete some emojis first.',
                });
            }

            // Get user's avatar URL (256x256 for better quality)
            const avatarURL = user.displayAvatarURL({ 
                extension: 'png', 
                size: 256,
                forceStatic: false 
            });

            // Download the avatar image
            const response = await axios.get(avatarURL, {
                responseType: 'arraybuffer',
                timeout: 10000
            });

            let imageBuffer = Buffer.from(response.data);

            // Process image based on shape
            if (shape === 'circle') {
                // Create circular mask
                const size = 256;
                const circleBuffer = Buffer.from(
                    `<svg width="${size}" height="${size}">
                        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
                    </svg>`
                );

                // Apply circular mask to the image
                imageBuffer = await sharp(imageBuffer)
                    .resize(size, size, { fit: 'cover' })
                    .composite([{
                        input: circleBuffer,
                        blend: 'dest-in'
                    }])
                    .png()
                    .toBuffer();
            } else {
                // Keep square shape but ensure proper size
                imageBuffer = await sharp(imageBuffer)
                    .resize(256, 256, { fit: 'cover' })
                    .png()
                    .toBuffer();
            }

            // Check file size (Discord emoji limit is 256KB)
            if (imageBuffer.length > 256000) {
                return await interaction.editReply({
                    content: '❌ Your avatar is too large to be converted into an emoji. Try using a smaller image!',
                });
            }

            // Create emoji name from username (remove special characters and spaces)
            const emojiName = user.username
                .replace(/[^a-zA-Z0-9]/g, '')
                .substring(0, 32) || 'user_emoji';

            // Create the emoji
            const emoji = await guild.emojis.create({
                attachment: imageBuffer,
                name: emojiName,
                reason: `Emoji created by ${user.tag} using /my-emoji command`
            });

            // Create success embed
            const shapeEmoji = shape === 'circle' ? '⭕' : '⬜';
            const successEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Emoji Created Successfully!')
                .setDescription(
                    `**Your avatar has been turned into an emoji!**\n\n` +
                    `**Emoji:** ${emoji}\n` +
                    `**Name:** \`:${emoji.name}:\`\n` +
                    `**ID:** \`${emoji.id}\`\n` +
                    `**Shape:** ${shapeEmoji} ${shape.charAt(0).toUpperCase() + shape.slice(1)}\n\n` +
                    `**How to use it:**\n` +
                    `• Type \`:${emoji.name}:\` in chat\n` +
                    `• Use the emoji picker\n` +
                    `• Copy and paste: ${emoji}\n\n` +
                    `*Note: This emoji is now available for everyone in this server!*`
                )
                .setThumbnail(emoji.url)
                .setFooter({ text: `Created by ${user.tag}`, iconURL: user.displayAvatarURL() })
                .setTimestamp();

            // Send the emoji in chat along with the embed
            await interaction.editReply({
                content: `${emoji} ${emoji} ${emoji}`,
                embeds: [successEmbed]
            });

            console.log(`[MY-EMOJI] ${user.tag} created emoji: ${emoji.name} (${emoji.id})`);

        } catch (error) {
            console.error('Error creating emoji:', error);

            let errorMessage = '❌ Failed to create emoji from your avatar.';

            if (error.code === 50013) {
                errorMessage = '❌ I don\'t have permission to create emojis! Please give me the "Manage Emojis and Stickers" permission.';
            } else if (error.code === 30008) {
                errorMessage = '❌ This server has reached its maximum number of emojis!';
            } else if (error.message.includes('timeout')) {
                errorMessage = '❌ Failed to download your avatar. Please try again!';
            } else if (error.message.includes('Invalid Form Body')) {
                errorMessage = '❌ Your avatar format is not supported. Please try changing your avatar!';
            }

            await interaction.editReply({
                content: errorMessage,
            });
        }
    },
};

