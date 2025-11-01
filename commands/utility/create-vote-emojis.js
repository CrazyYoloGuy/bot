const { SlashCommandBuilder } = require('discord.js');
const { getLegitVotes } = require('../../utils/database');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-vote-emojis')
        .setDescription('Create emojis for all users who have voted (Admin only)'),

    async execute(interaction, client) {
        // Check if user has required role
        const REQUIRED_ROLE_ID = '1424847975842054395';
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return await interaction.reply({
                content: '❌ **Access Denied!**\n\nYou do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Check if user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ You need Administrator permission to use this command!',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            const guild = interaction.guild;

            // Get all votes
            const votesResult = await getLegitVotes(guild.id);
            
            if (!votesResult.success || votesResult.data.length === 0) {
                return await interaction.editReply({
                    content: '📊 No votes have been cast yet!'
                });
            }

            const votes = votesResult.data;
            
            // Check emoji limit
            const emojiLimit = guild.premiumTier === 0 ? 50 : guild.premiumTier === 1 ? 100 : guild.premiumTier === 2 ? 150 : 250;
            const availableSlots = emojiLimit - guild.emojis.cache.size;

            let created = 0;
            let skipped = 0;
            let failed = 0;

            await interaction.editReply({
                content: `🔄 Creating emojis for ${votes.length} voters...\n\n` +
                         `Available emoji slots: ${availableSlots}/${emojiLimit}`
            });

            for (const vote of votes) {
                try {
                    // Check if emoji already exists
                    const emojiName = `user_${vote.user_id.slice(-8)}`;
                    const existingEmoji = guild.emojis.cache.find(e => e.name === emojiName);
                    
                    if (existingEmoji) {
                        skipped++;
                        continue;
                    }

                    // Check if we have space
                    if (guild.emojis.cache.size >= emojiLimit) {
                        failed++;
                        continue;
                    }

                    // Download avatar
                    const response = await axios.get(vote.user_avatar, {
                        responseType: 'arraybuffer',
                        timeout: 5000
                    });
                    
                    let imageBuffer = Buffer.from(response.data);
                    
                    // Create circular emoji (32x32)
                    const size = 32;
                    const circleBuffer = Buffer.from(
                        `<svg width="${size}" height="${size}">
                            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
                        </svg>`
                    );
                    
                    imageBuffer = await sharp(imageBuffer)
                        .resize(size, size, { fit: 'cover' })
                        .composite([{
                            input: circleBuffer,
                            blend: 'dest-in'
                        }])
                        .png()
                        .toBuffer();
                    
                    // Check size
                    if (imageBuffer.length > 256000) {
                        failed++;
                        continue;
                    }
                    
                    // Create emoji
                    await guild.emojis.create({
                        attachment: imageBuffer,
                        name: emojiName,
                        reason: `Vote emoji for ${vote.username}`
                    });
                    
                    created++;
                    
                    // Update progress every 5 emojis
                    if (created % 5 === 0) {
                        await interaction.editReply({
                            content: `🔄 Creating emojis...\n\n` +
                                     `✅ Created: ${created}\n` +
                                     `⏭️ Skipped: ${skipped}\n` +
                                     `❌ Failed: ${failed}\n` +
                                     `📊 Progress: ${created + skipped + failed}/${votes.length}`
                        });
                    }
                    
                } catch (error) {
                    console.error(`Failed to create emoji for ${vote.username}:`, error.message);
                    failed++;
                }
            }

            // Final report
            await interaction.editReply({
                content: `✅ **Emoji Creation Complete!**\n\n` +
                         `✅ Created: **${created}** new emojis\n` +
                         `⏭️ Skipped: **${skipped}** (already exist)\n` +
                         `❌ Failed: **${failed}** (errors or limits)\n\n` +
                         `📊 Total voters: **${votes.length}**\n` +
                         `🎨 Server emojis: **${guild.emojis.cache.size}/${emojiLimit}**\n\n` +
                         `*These emojis will now appear in vote previews!*`
            });

            console.log(`[CREATE-VOTE-EMOJIS] Created ${created} emojis, skipped ${skipped}, failed ${failed}`);

        } catch (error) {
            console.error('Error creating vote emojis:', error);
            await interaction.editReply({
                content: '❌ Failed to create vote emojis. Please try again.'
            });
        }
    },
};

