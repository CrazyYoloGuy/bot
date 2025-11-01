const { Events, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;

        // !addemoji command
        if (message.content.startsWith('!addemoji')) {
            console.log(`[ADDEMOJI] Command received from ${message.author.tag}: "${message.content}"`);

            try {
                // Add reaction to show bot is processing
                await message.react('⏳').catch(err => console.log('[ADDEMOJI] Could not add reaction:', err.message));

                // Check if command is just "!addemoji" with nothing else
                const trimmedContent = message.content.trim();
                if (trimmedContent === '!addemoji' && message.attachments.size === 0) {
                    console.log('[ADDEMOJI] No emoji provided, showing help');
                    await message.reactions.removeAll().catch(() => {});
                    return await message.reply('❌ **Please provide an emoji!**\n\n**Usage:** `!addemoji <emoji>` or `!addemoji <emoji> <name>`\n\n**Examples:**\n• `!addemoji <:customemoji:123456789>`\n• `!addemoji <:customemoji:123456789> newname`\n• `!addemoji https://example.com/emoji.png emojiname`\n• Upload an image and type: `!addemoji emojiname`\n\n**Tip:** Right-click an emoji → Copy → Paste it in the command!');
                }

                // Check if user has Manage Emojis permission
                if (!message.member.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
                    console.log('[ADDEMOJI] User lacks permissions');
                    await message.reactions.removeAll().catch(() => {});
                    return await message.reply('❌ You need **Manage Emojis and Stickers** permission to use this command!');
                }

                // Check if bot has Manage Emojis permission
                if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
                    console.log('[ADDEMOJI] Bot lacks permissions');
                    await message.reactions.removeAll().catch(() => {});
                    return await message.reply('❌ I need **Manage Emojis and Stickers** permission to add emojis!');
                }

                // Parse the command - handle emojis in the message content
                let emojiArg = null;
                let emojiName = null;

                // Check if there's a custom emoji in the message (from reactions or message content)
                let customEmojiMatch = message.content.match(/<a?:(\w+):(\d+)>/);

                console.log('[ADDEMOJI] Custom emoji match:', customEmojiMatch);

                if (customEmojiMatch) {
                    // Found custom emoji format <:name:id>
                    emojiArg = customEmojiMatch[0];
                    const args = message.content.split(' ');
                    emojiName = args[2] || null;
                    console.log('[ADDEMOJI] Found custom emoji:', emojiArg, 'Name:', emojiName);
                } else {
                    // Parse as regular arguments
                    const args = message.content.split(' ');

                    if (args.length < 2 && message.attachments.size === 0) {
                        console.log('[ADDEMOJI] No arguments and no attachments');
                        await message.reactions.removeAll().catch(() => {});
                        return await message.reply('❌ **Usage:** `!addemoji <emoji>` or `!addemoji <emoji> <name>`\n\n**Examples:**\n• `!addemoji <:customemoji:123456789>`\n• `!addemoji <:customemoji:123456789> newname`\n• `!addemoji https://example.com/emoji.png emojiname`\n• Upload an image and type: `!addemoji emojiname`\n\n**Tip:** Right-click an emoji and copy it, then paste it in the command!');
                    }

                    emojiArg = args[1];
                    emojiName = args[2] || null;
                    console.log('[ADDEMOJI] Parsed args - emojiArg:', emojiArg, 'emojiName:', emojiName);
                }

                // Re-check if it's a custom emoji from the parsed argument
                if (!customEmojiMatch && emojiArg) {
                    customEmojiMatch = emojiArg.match(/<a?:(\w+):(\d+)>/);
                    console.log('[ADDEMOJI] Re-checked custom emoji match:', customEmojiMatch);
                }

                if (customEmojiMatch) {
                    // Custom emoji from another server
                    const name = emojiName || customEmojiMatch[1];
                    const emojiId = customEmojiMatch[2];
                    const isAnimated = emojiArg.startsWith('<a:');
                    const extension = isAnimated ? 'gif' : 'png';
                    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;

                    console.log(`[ADDEMOJI] Creating emoji - Name: ${name}, ID: ${emojiId}, URL: ${emojiUrl}`);

                    // Check if emoji already exists in this server
                    const existingEmoji = message.guild.emojis.cache.find(e => e.name === name);
                    if (existingEmoji) {
                        console.log(`[ADDEMOJI] Emoji ${name} already exists`);
                        await message.reactions.removeAll().catch(() => {});
                        return await message.reply(`❌ An emoji with the name **${name}** already exists in this server!`);
                    }

                    // Add the emoji
                    console.log(`[ADDEMOJI] Adding emoji to server...`);
                    const newEmoji = await message.guild.emojis.create({
                        attachment: emojiUrl,
                        name: name,
                        reason: `Added by ${message.author.tag} via !addemoji command`
                    });

                    console.log(`[ADDEMOJI] Successfully added emoji: ${newEmoji.name} (${newEmoji.id})`);

                    await message.reactions.removeAll().catch(() => {});
                    await message.react('✅').catch(() => {});
                    await message.reply(`✅ **Emoji Added!**\n\n**Name:** ${newEmoji.name}\n**Emoji:** ${newEmoji}\n**ID:** \`${newEmoji.id}\`\n**Animated:** ${isAnimated ? 'Yes' : 'No'}`);

                    console.log(`[ADDEMOJI] ${message.author.tag} added emoji: ${newEmoji.name} (${newEmoji.id})`);
                }
                // Check if it's a URL
                else if (emojiArg.startsWith('http://') || emojiArg.startsWith('https://')) {
                    if (!emojiName) {
                        return await message.reply('❌ Please provide a name for the emoji!\n\n**Usage:** `!addemoji <url> <name>`\n**Example:** `!addemoji https://example.com/emoji.png myemoji`');
                    }

                    // Check if emoji already exists
                    const existingEmoji = message.guild.emojis.cache.find(e => e.name === emojiName);
                    if (existingEmoji) {
                        return await message.reply(`❌ An emoji with the name **${emojiName}** already exists in this server!`);
                    }

                    // Add the emoji from URL
                    const newEmoji = await message.guild.emojis.create({
                        attachment: emojiArg,
                        name: emojiName,
                        reason: `Added by ${message.author.tag} via !addemoji command`
                    });

                    await message.reactions.removeAll().catch(() => {});
                    await message.react('✅').catch(() => {});
                    await message.reply(`✅ **Emoji Added!**\n\n**Name:** ${newEmoji.name}\n**Emoji:** ${newEmoji}\n**ID:** \`${newEmoji.id}\``);

                    console.log(`[EMOJI] ${message.author.tag} added emoji from URL: ${newEmoji.name} (${newEmoji.id})`);
                }
                // Check if it's an attachment
                else if (message.attachments.size > 0) {
                    const attachment = message.attachments.first();

                    if (!emojiName) {
                        // Use filename without extension as name
                        emojiName = attachment.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_');
                    }

                    // Check if emoji already exists
                    const existingEmoji = message.guild.emojis.cache.find(e => e.name === emojiName);
                    if (existingEmoji) {
                        return await message.reply(`❌ An emoji with the name **${emojiName}** already exists in this server!`);
                    }

                    // Add the emoji from attachment
                    const newEmoji = await message.guild.emojis.create({
                        attachment: attachment.url,
                        name: emojiName,
                        reason: `Added by ${message.author.tag} via !addemoji command`
                    });

                    await message.reactions.removeAll().catch(() => {});
                    await message.react('✅').catch(() => {});
                    await message.reply(`✅ **Emoji Added!**\n\n**Name:** ${newEmoji.name}\n**Emoji:** ${newEmoji}\n**ID:** \`${newEmoji.id}\``);

                    console.log(`[EMOJI] ${message.author.tag} added emoji from attachment: ${newEmoji.name} (${newEmoji.id})`);
                }
                // Unicode emoji (can't be added to server)
                else {
                    await message.reactions.removeAll().catch(() => {});
                    return await message.reply('❌ **Invalid emoji format!**\n\n**Supported formats:**\n• Custom emoji from another server: `!addemoji <:emoji:123456789>`\n• Image URL: `!addemoji https://example.com/emoji.png emojiname`\n• Attachment: Upload an image and use `!addemoji emojiname`\n\n**Tip:** Right-click an emoji → Copy → Paste it in the command!');
                }

            } catch (error) {
                console.error('Error adding emoji:', error);

                await message.reactions.removeAll().catch(() => {});
                await message.react('❌').catch(() => {});

                let errorMessage = '❌ Failed to add emoji!';

                if (error.code === 30008) {
                    errorMessage = '❌ **Maximum number of emojis reached!**\n\nThis server has reached the maximum number of emojis allowed. Please delete some emojis first.';
                } else if (error.code === 50035) {
                    errorMessage = '❌ **Invalid emoji!**\n\nThe emoji name must be between 2-32 characters and contain only alphanumeric characters and underscores.';
                } else if (error.message.includes('Asset exceeds maximum size')) {
                    errorMessage = '❌ **File too large!**\n\nThe emoji file must be smaller than 256 KB.';
                } else {
                    errorMessage = `❌ **Error:** ${error.message}`;
                }

                await message.reply(errorMessage);
            }
        }
    },
};

