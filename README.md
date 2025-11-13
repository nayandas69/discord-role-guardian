# Discord Role Guardian

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blueviolet)

A Discord bot that makes server management incredibly easy. Set up reaction roles, welcome new members with style, and keep your community organized - all through simple slash commands.

## What This Bot Does

Think of this bot as your server's personal assistant. It handles the boring stuff so you can focus on building your community. Here's what makes it special:

- **Reaction Roles** - Members click an emoji, they get a role. It's that simple. Perfect for game roles, color roles, notification preferences, or anything else you can think of.
- **Welcome Messages** - Give new members a warm greeting with beautiful embedded messages that show them they're valued.
- **Leave Messages** - Say goodbye with class when members leave your server.
- **Smart Activity Status** - Your bot stays interesting with rotating status messages that change automatically every few minutes.
- **Modern Slash Commands** - No more remembering weird prefixes. Everything works with Discord's built-in slash command system.
- **Typing Indicators** - The bot shows it's working when processing your commands, just like a real person would.
- **Admin Protection** - Only server administrators can configure the bot, keeping your server secure.
- **Full Customization** - Change colors, messages, and everything else to match your server's vibe.
- **Developer-Friendly Logs** - Console output is color-coded so you can instantly see what's happening.
- **Data Persistence** - Your configurations are saved to disk, so they survive bot restarts.

## What's Coming Next

This project is actively being developed, and some exciting features are on the roadmap:

- **Web Dashboard** - Manage everything through a beautiful web interface instead of commands
- **Advanced Analytics** - Track member growth, popular roles, and server statistics
- **Custom Commands** - Create your own commands without touching code
- **Auto-Moderation** - Automatic spam protection and word filtering
- **Leveling System** - Reward active members with XP and level-up roles
- **Multi-Server Support** - Run one bot across multiple Discord servers
- **Database Integration** - PostgreSQL or MongoDB for production deployments
- **Scheduled Messages** - Automatic announcements and reminders
- **And much more!** - This bot is just getting started

## Before You Begin

Make sure you have these ready:

- **Node.js 18 or newer** - The bot runs on Node.js, so you'll need it installed
- **A Discord account** - Obviously, you need Discord
- **Admin access** - You need administrator permissions in your server to set things up

## Getting Your Bot Running

### Step 1: Create Your Bot on Discord

Head over to the [Discord Developer Portal](https://discord.com/developers/applications) and click the "New Application" button. Give your bot a cool name (you can always change it later) and hit Create.

### Step 2: Grab Your Client ID

On the General Information page, you'll see an "Application ID" field. Click Copy and save this somewhere - this is your `CLIENT_ID`. You'll need it in a minute.

### Step 3: Create the Bot User and Get Your Token

Click the "Bot" tab on the left sidebar, then click "Add Bot". Discord will ask you to confirm - go ahead and do that.

Now here's the important part: Under the Token section, click "Reset Token". Discord will show you a long string of random characters - click Copy immediately. This is your `DISCORD_TOKEN`.

**Important**: This token is like a password to your bot. Never share it with anyone, never post it online, and never commit it to GitHub. If someone gets your token, they can control your bot.

### Step 4: Turn On the Right Permissions

While you're still on the Bot page, scroll down to "Privileged Gateway Intents" and enable these two:

- **SERVER MEMBERS INTENT** - Without this, welcome and leave messages won't work
- **MESSAGE CONTENT INTENT** - This lets the bot handle reactions properly

### Step 5: Get Your Server ID

Open Discord and go to User Settings, then Advanced. Turn on "Developer Mode". Now right-click on your server's icon and select "Copy Server ID". Save this - it's your `GUILD_ID`.

### Step 6: Grab Your Channel IDs

You'll need the IDs for channels where you want welcome messages, leave messages, and reaction role setups. With Developer Mode still on, right-click any channel and choose "Copy Channel ID". Do this for each channel you plan to use.

### Step 7: Get Your Role IDs

For reaction roles to work, you need role IDs. Go to Server Settings > Roles, right-click any role, and select "Copy Role ID". Do this for every role you want to assign through reactions.

### Step 8: Invite Your Bot to Your Server

Back in the Developer Portal, go to OAuth2 > URL Generator. Select these scopes:
- `bot`
- `applications.commands`

Then under Bot Permissions, select:
- Manage Roles
- Send Messages
- Embed Links
- Add Reactions
- Read Message History
- View Channels

Copy the URL at the bottom, open it in your browser, and invite your bot to your server.

Quick link (just replace YOUR_CLIENT_ID with your actual client ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=268445760&scope=bot%20applications.commands
```

### Step 9: Download and Install the Bot

Clone this repository to your computer and install the dependencies:

```bash
git clone https://github.com/nayandas69/discord-role-guardian.git
cd discord-role-guardian
```

Now install everything using the Makefile (this makes it super easy):

```bash
make setup
```

Or if you prefer doing it manually:

```bash
npm install
```

### Step 10: Set Up Your Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Open the `.env` file in any text editor and fill in your values:

```env
DISCORD_TOKEN=your_bot_token_from_step_3
CLIENT_ID=your_client_id_from_step_2
GUILD_ID=your_guild_id_from_step_5
```

### Step 11: Start Your Bot

You have three options to run the bot:

**Option 1: Using Makefile (Recommended)**
```bash
make run
```

This automatically installs dependencies and starts the bot. Super convenient!

**Option 2: Production Mode**
```bash
npm start
```

**Option 3: Development Mode**
```bash
npm run dev
```

This restarts the bot automatically when you edit files. Great for testing changes.

When your bot starts, you'll see beautiful colored console output:
- **GREEN** - Everything is working great
- **RED** - Something went wrong
- **CYAN** - General information
- **YELLOW** - Warnings you should know about
- **BLUE** - System operations happening
- **MAGENTA** - Commands being executed

### Step 12: Make Sure Everything Works

Check your Discord server - your bot should be online in the member list. Type `/` in any channel and you should see your bot's commands appear. Watch the bot's status change every few minutes to know the activity rotation is working.

## Makefile Commands

The Makefile makes common tasks super simple. Here's what you can do:

```bash
# See all available commands
make help

# First-time setup (install dependencies)
make setup

# Run the bot (install dependencies if needed, then start)
make run

# Development mode with auto-restart
make dev

# Just start the bot (assumes dependencies are installed)
make start

# Install or update dependencies
make install

# Remove node_modules and package-lock.json
make clean

# Remove node_modules and reinstall everything
make reinstall
```

Most of the time, you'll just use `make run` and you're good to go!

## Using the Bot

### Setting Up Reaction Roles

First, create or choose the roles you want to use (Server Settings > Roles). Get each role's ID by right-clicking it and selecting "Copy Role ID".

Then run this command in Discord:

```
/setup-reaction-roles
  channel: #roles
  title: Choose Your Roles
  description: React below to get your roles!
  roles: 🔴:1234567890123456789,🔵:9876543210987654321
```

The roles format is `emoji:roleID,emoji:roleID` - use any Discord emoji, put a colon, then the role ID. Separate multiple roles with commas and no spaces.

Example:
```
roles: 🎮:123456789,🎨:987654321,🎵:555555555
```

### Setting Up Welcome Messages

Run this command to greet new members:

```
/setup-welcome
  channel: #welcome
  message: Welcome {user} to {server}! You are member #{count}!
  embed-color: #00ff00
```

You can use these placeholders in your message:
- `{user}` - Mentions the new member
- `{server}` - Your server's name
- `{count}` - Total member count

### Setting Up Leave Messages

Say goodbye when someone leaves:

```
/setup-leave
  channel: #goodbye
  message: Goodbye {user}! Thanks for being part of {server}
  embed-color: #ff0000
```

Available placeholders:
- `{user}` - The member's username
- `{server}` - Your server's name

### Removing Reaction Roles

If you want to remove a reaction role message, right-click the message, select "Copy Message ID", then run:

```
/remove-reaction-roles
  message-id: 1234567890123456789
```

### Resetting All Configurations

If you want to start fresh and remove all bot configurations:

```
/reset
```

This removes all reaction roles, welcome settings, and leave settings. Use this carefully - there's no undo!

## Important Things to Know

### Role Hierarchy Matters

Discord has a role hierarchy system. Your bot can only assign roles that are **below** its own role in the list. To fix this:

1. Go to Server Settings > Roles
2. Find your bot's role
3. Drag it above all the roles it needs to assign
4. Save and you're good to go

### Channel Permissions

Make sure your bot can actually access the channels you configure:
- For reaction roles: Read Messages, Send Messages, Add Reactions, Read Message History
- For welcome/leave messages: View Channel, Send Messages, Embed Links

### Testing Your Setup

After configuration, test everything:
1. React to your reaction role message - do you get the role?
2. Have a friend join (or use a test account) - does the welcome message appear?
3. Have someone leave - does the goodbye message show up?

## When Things Go Wrong

### Reaction Roles Aren't Working

- Double-check that the bot has "Read Message History" permission in that channel
- Make sure the role IDs are correct - copy them fresh from Discord
- Verify the bot's role is higher than the roles it's trying to assign
- Try restarting the bot after making role changes

### Slash Commands Don't Appear

- Wait up to an hour - sometimes Discord takes a while to register commands
- Make sure you invited the bot with the `applications.commands` scope
- Check that your `GUILD_ID` in the `.env` file is correct
- Try kicking and reinviting the bot

### Welcome or Leave Messages Aren't Sending

- Verify the channel ID is correct
- Make sure the bot has permission to send messages in that channel
- Check that "SERVER MEMBERS INTENT" is enabled in the Developer Portal
- Look at the console output for permission error messages

### Bot Crashes on Startup

- Check that all values in `.env` are correct and there are no extra spaces
- Make sure your bot token is still valid (regenerate it if needed)
- Verify Node.js is version 18 or higher by running `node --version`
- Try `make reinstall` to get fresh dependencies

### "Missing Permissions" Errors

- Go to Server Settings > Roles and find your bot's role
- Enable all the permissions it needs manually
- Drag the bot's role higher in the hierarchy
- Make sure channel-specific permissions aren't blocking the bot

## Making It Your Own

### Changing Bot Activities

Edit `src/utils/activityManager.js` and customize the activities array:

```js
const activities = [
  { name: 'Managing your roles', type: ActivityType.Playing },
  { name: 'for new members', type: ActivityType.Watching },
  { name: '/help for commands', type: ActivityType.Listening },
];
```

Activity types you can use:
- `ActivityType.Playing` - "Playing ..."
- `ActivityType.Watching` - "Watching ..."
- `ActivityType.Listening` - "Listening to ..."
- `ActivityType.Streaming` - "Streaming ..." (needs a URL)
- `ActivityType.Competing` - "Competing in ..."

### Changing How Often Activities Rotate

In `src/utils/activityManager.js`, adjust these values:

```js
const minInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
const maxInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
```

### Customizing Console Colors

Don't like the color scheme in the terminal? Edit `src/utils/colors.js` to change them to whatever you prefer.

## Contributing

Found a bug? Have an idea for a feature? Contributions are welcome! Fork the repo, make your changes, and submit a pull request. For major changes, open an issue first so we can discuss it.

## License

MIT License - This means you're free to use, modify, and distribute this bot however you want. Go wild!

## Author

Built by **nayandas69**

Check out more projects: [github.com/nayandas69](https://github.com/nayandas69)

## Credits and Thanks

- Built with [discord.js v14](https://discord.js.org/) - The best Discord API library
- Uses modern Discord slash commands for a better user experience
- Colored console logging makes development and debugging so much easier
- Special thanks to everyone who tests and provides feedback

---

**Star this repo if it helps your server!** More stars = more motivation to add cool features.

Made with care for Discord communities around the world.
