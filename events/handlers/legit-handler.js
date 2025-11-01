const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveLegitVote, getLegitVotes, getLegitVoteStats, getLegitConfig } = require('../../utils/database');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle button interactions for Legit Verification
        if (interaction.isButton()) {
            const { customId } = interaction;

            // Check if it's a legit vote button
            if (customId.startsWith('legit_')) {
                
                // Handle Yes vote
                if (customId === 'legit_vote_yes') {
                    await handleVote(interaction, 'yes');
                }
                
                // Handle No vote
                else if (customId === 'legit_vote_no') {
                    await handleVote(interaction, 'no');
                }
                
                // Handle Preview Votes
                else if (customId === 'legit_preview_votes') {
                    await handlePreviewVotes(interaction, 0);
                }
                
                // Handle pagination
                else if (customId.startsWith('legit_page_')) {
                    const page = parseInt(customId.split('_')[2]);
                    await handlePreviewVotes(interaction, page);
                }
            }
        }
    },
};

// Handle voting
async function handleVote(interaction, vote) {
    try {
        // Defer reply immediately to prevent timeout
        await interaction.deferReply({ flags: 64 }); // 64 = ephemeral

        const user = interaction.user;
        const guild = interaction.guild;

        // Get user's avatar URL (force static to avoid animated GIFs)
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true });

        // Save vote to database
        const result = await saveLegitVote(
            guild.id,
            user.id,
            user.username,
            avatarURL,
            vote
        );

        if (!result.success) {
            return await interaction.editReply({
                content: '❌ Failed to save your vote. Please try again!'
            });
        }

        // Get updated stats
        const statsResult = await getLegitVoteStats(guild.id);
        const stats = statsResult.success ? statsResult.data : { total: 0, yes: 0, no: 0 };

        // Update the original message with new stats (don't await, do it in background)
        updateLegitMessage(interaction, stats).catch(err =>
            console.error('Error updating legit message:', err)
        );

        // Send confirmation
        const voteEmoji = vote === 'yes' ? '✅' : '❌';
        const voteText = vote === 'yes' ? 'Yes, Legit!' : 'No, Not Legit';

        await interaction.editReply({
            content: `${voteEmoji} **Your vote has been recorded!**\n\n` +
                     `You voted: **${voteText}**\n\n` +
                     `*You can change your vote anytime by clicking a different button.*`
        });

        console.log(`[LEGIT-VOTE] ${user.tag} voted: ${vote}`);

    } catch (error) {
        console.error('Error handling vote:', error);

        // Try to respond with error
        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ An error occurred while processing your vote.'
            }).catch(() => {});
        } else {
            await interaction.reply({
                content: '❌ An error occurred while processing your vote.',
                flags: 64
            }).catch(() => {});
        }
    }
}

// Update the legit message with new stats
async function updateLegitMessage(interaction, stats) {
    try {
        const guild = interaction.guild;

        // Calculate percentages
        const yesPercentage = stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0;
        const noPercentage = stats.total > 0 ? Math.round((stats.no / stats.total) * 100) : 0;

        // Create progress bars
        const yesBar = createProgressBar(yesPercentage, 20);
        const noBar = createProgressBar(noPercentage, 20);

        // Create updated embed
        const legitEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🛡️ Legit Verification')
            .setDescription(
                `**Help us build trust in our community!**\n\n` +
                `We value transparency and want to know what you think about our services. ` +
                `Your honest feedback helps us improve and shows potential clients that we're trustworthy.\n\n` +
                `**Are we legit?** Vote below! 👇`
            )
            .addFields(
                {
                    name: '✅ Yes - We\'re Legit!',
                    value: `${yesBar} **${stats.yes}** votes (${yesPercentage}%)`,
                    inline: false
                },
                {
                    name: '❌ No - Not Legit',
                    value: `${noBar} **${stats.no}** votes (${noPercentage}%)`,
                    inline: false
                },
                {
                    name: '📊 Total Votes',
                    value: `**${stats.total}** community members have voted`,
                    inline: false
                }
            )
            .setFooter({ 
                text: `${guild.name} • Your vote matters!`, 
                iconURL: guild.iconURL() 
            })
            .setTimestamp();

        // Update the message
        await interaction.message.edit({
            embeds: [legitEmbed]
        });

    } catch (error) {
        console.error('Error updating legit message:', error);
    }
}

// Handle preview votes with pagination
async function handlePreviewVotes(interaction, page = 0) {
    try {
        // Defer reply immediately
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: 64 }); // 64 = ephemeral
        }

        const guild = interaction.guild;

        // Get all votes
        const votesResult = await getLegitVotes(guild.id);

        if (!votesResult.success || votesResult.data.length === 0) {
            if (interaction.deferred) {
                return await interaction.editReply({
                    content: '📊 No votes have been cast yet!'
                });
            } else {
                return await interaction.reply({
                    content: '📊 No votes have been cast yet!',
                    flags: 64
                });
            }
        }

        const allVotes = votesResult.data;
        const itemsPerPage = 15;
        const totalPages = Math.ceil(allVotes.length / itemsPerPage);
        
        // Ensure page is within bounds
        page = Math.max(0, Math.min(page, totalPages - 1));

        // Get votes for current page
        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageVotes = allVotes.slice(startIndex, endIndex);

        // Create embed with votes
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📊 Vote Preview')
            .setFooter({
                text: `Page ${page + 1} of ${totalPages} • ${guild.name}`,
                iconURL: guild.iconURL()
            })
            .setTimestamp();

        // Build description with all votes and avatars
        let description = `**All votes from community members**\n\n` +
                         `Showing ${startIndex + 1}-${Math.min(endIndex, allVotes.length)} of ${allVotes.length} votes\n\n`;

        // Separate yes and no votes
        const yesVotesList = [];
        const noVotesList = [];

        for (const vote of pageVotes) {
            if (vote.vote === 'yes') {
                yesVotesList.push(vote);
            } else {
                noVotesList.push(vote);
            }
        }

        // Add Yes votes section with user mentions (shows avatars automatically)
        if (yesVotesList.length > 0) {
            description += `**✅ Yes Votes (${yesVotesList.length})**\n`;
            for (const vote of yesVotesList) {
                // Check if user has custom emoji already
                const emojiName = `user_${vote.user_id.slice(-8)}`;
                const existingEmoji = guild.emojis.cache.find(e => e.name === emojiName);

                if (existingEmoji) {
                    // Use existing emoji
                    description += `${existingEmoji} **${vote.username}**\n`;
                } else {
                    // Use mention (shows avatar automatically in Discord)
                    description += `<@${vote.user_id}> **${vote.username}**\n`;
                }
            }
            description += '\n';
        }

        // Add No votes section with user mentions (shows avatars automatically)
        if (noVotesList.length > 0) {
            description += `**❌ No Votes (${noVotesList.length})**\n`;
            for (const vote of noVotesList) {
                // Check if user has custom emoji already
                const emojiName = `user_${vote.user_id.slice(-8)}`;
                const existingEmoji = guild.emojis.cache.find(e => e.name === emojiName);

                if (existingEmoji) {
                    // Use existing emoji
                    description += `${existingEmoji} **${vote.username}**\n`;
                } else {
                    // Use mention (shows avatar automatically in Discord)
                    description += `<@${vote.user_id}> **${vote.username}**\n`;
                }
            }
        }

        // Update embed with new description
        embed.setDescription(description);

        // Set thumbnail to first voter's avatar
        if (pageVotes.length > 0 && pageVotes[0].user_avatar) {
            embed.setThumbnail(pageVotes[0].user_avatar);
        }

        // Create pagination buttons
        const buttons = new ActionRowBuilder();

        if (totalPages > 1) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`legit_page_${Math.max(0, page - 1)}`)
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId(`legit_page_${page}`)
                    .setLabel(`Page ${page + 1}/${totalPages}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`legit_page_${Math.min(totalPages - 1, page + 1)}`)
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages - 1)
            );
        }

        // Send or update the preview
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                embeds: [embed],
                components: totalPages > 1 ? [buttons] : []
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: totalPages > 1 ? [buttons] : [],
                flags: 64
            });
        }

        console.log(`[LEGIT-PREVIEW] ${interaction.user.tag} viewed votes page ${page + 1}`);

    } catch (error) {
        console.error('Error handling preview votes:', error);

        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ An error occurred while loading votes.'
            }).catch(() => {});
        } else {
            await interaction.reply({
                content: '❌ An error occurred while loading votes.',
                flags: 64
            }).catch(() => {});
        }
    }
}

// Helper function to create progress bars
function createProgressBar(percentage, length = 20) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `\`${bar}\``;
}

// Helper function to create or find user emoji
async function createUserEmoji(guild, userId, username, avatarURL) {
    try {
        // Create safe emoji name from user ID
        const emojiName = `user_${userId.slice(-8)}`;

        // Check if emoji already exists
        const existingEmoji = guild.emojis.cache.find(e => e.name === emojiName);
        if (existingEmoji) {
            return existingEmoji.toString();
        }

        // Check emoji limit
        const emojiLimit = guild.premiumTier === 0 ? 50 : guild.premiumTier === 1 ? 100 : guild.premiumTier === 2 ? 150 : 250;
        if (guild.emojis.cache.size >= emojiLimit) {
            return null; // Can't create more emojis
        }

        // Download avatar
        const response = await axios.get(avatarURL, {
            responseType: 'arraybuffer',
            timeout: 5000
        });

        let imageBuffer = Buffer.from(response.data);

        // Create circular emoji (32x32 for small size)
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

        // Check size limit (256KB)
        if (imageBuffer.length > 256000) {
            return null;
        }

        // Create emoji
        const emoji = await guild.emojis.create({
            attachment: imageBuffer,
            name: emojiName,
            reason: `Avatar emoji for vote preview - ${username}`
        });

        return emoji.toString();

    } catch (error) {
        console.error(`Error creating emoji for ${username}:`, error.message);
        return null;
    }
}

