const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

// Grab all command files
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`⚠️ [WARNING] The command at ${filePath} is missing "data" or "execute" property.`);
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// Deploy commands
(async () => {
    try {
        console.log(`\n🔄 Started refreshing ${commands.length} application (/) commands.`);

        let data;
        let deploymentType = 'global';

        // Try guild-based commands first (faster for testing)
        if (config.guildId) {
            try {
                console.log(`📍 Attempting to deploy to guild: ${config.guildId}`);
                data = await rest.put(
                    Routes.applicationGuildCommands(config.clientId, config.guildId),
                    { body: commands },
                );
                deploymentType = 'guild';
                console.log(`✅ Successfully reloaded ${data.length} guild (/) commands.`);
                console.log(`⚡ Commands should appear instantly in your server!`);
            } catch (guildError) {
                console.log(`⚠️ Guild deployment failed: ${guildError.message}`);
                console.log(`🔄 Falling back to global deployment...`);

                // Fall back to global deployment
                data = await rest.put(
                    Routes.applicationCommands(config.clientId),
                    { body: commands },
                );
                console.log(`✅ Successfully reloaded ${data.length} global (/) commands.`);
                console.log(`⏳ Global commands can take up to 1 hour to appear.`);
            }
        }
        // For global commands (takes up to 1 hour to update)
        else {
            data = await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${data.length} global (/) commands.`);
            console.log(`⏳ Global commands can take up to 1 hour to appear.`);
        }

        console.log(`\n📋 Deployed commands:`);
        data.forEach(cmd => console.log(`   - /${cmd.name}`));

        console.log(`\n💡 Tips:`);
        if (deploymentType === 'global') {
            console.log(`   - Global commands can take up to 1 hour to show up`);
            console.log(`   - Try restarting Discord (Ctrl+R) after a few minutes`);
        } else {
            console.log(`   - Commands should appear immediately`);
            console.log(`   - Try typing / in your Discord server`);
        }
        console.log(`   - Make sure bot was invited with "applications.commands" scope`);
        console.log(`   - Run "npm run invite" to get the correct invite link\n`);

    } catch (error) {
        console.error('\n❌ Error deploying commands:', error.message);

        if (error.code === 50001) {
            console.log(`\n🔧 Fix: The bot needs to be invited to the server!`);
            console.log(`   1. Run: npm run invite`);
            console.log(`   2. Open the link and invite the bot`);
            console.log(`   3. Make sure to select the correct server`);
            console.log(`   4. Try deploying again\n`);
        } else if (error.code === 0) {
            console.log(`\n🔧 Fix: Invalid token!`);
            console.log(`   1. Go to https://discord.com/developers/applications`);
            console.log(`   2. Select your app → Bot → Reset Token`);
            console.log(`   3. Update TOKEN in .env file`);
            console.log(`   4. Try deploying again\n`);
        }
    }
})();

