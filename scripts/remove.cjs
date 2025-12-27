const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken('your-bot-token-here');

(async () => {
  try {
    console.log('Removing all global slash commands...');

    await rest.put(
      Routes.applicationCommands('your-client-id-here'),
      { body: [] }
    );

    console.log('✅ All slash commands removed from the bot!');
  } catch (error) {
    console.error(error);
  }
})();
