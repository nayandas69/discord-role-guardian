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
- **Leveling System** - Reward active members with XP for chatting. Members level up automatically and can earn special roles at specific levels. View leaderboards and track progress with instant XP notifications.
- **Multi-Server Support** - Run one bot instance across unlimited Discord servers. Each server has completely independent configurations and data.
- **Scheduled Messages** - Set up automatic announcements that repeat daily, weekly, or at custom intervals. Perfect for reminders and recurring messages.
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

> [!IMPORTANT]
> This token is like a password to your bot. Never share it with anyone, never post it online, and never commit it to GitHub.
> If someone gets your token, they can control your bot.

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

### Command Permissions

**Admin-Only Commands** (Require Administrator Permission):
- All setup commands (`/setup-*`)
- `/add-level-role` - Configure level rewards
- `/schedule-message` - Create scheduled messages
- `/list-scheduled` - View scheduled messages
- `/remove-scheduled` - Delete scheduled messages
- `/remove-reaction-roles` - Remove reaction role configs
- `/reset` - Reset all bot configurations

**Public Commands** (Available to All Members):
- `/rank [user]` - Check your level and XP
- `/leaderboard [limit]` - View the server leaderboard

Only server administrators (members with the Administrator permission) can configure and set up the bot. Regular members can use public commands like viewing ranks and leaderboards.

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

### Setting Up the Leveling System

Enable XP and leveling for your server:

```
/setup-leveling
  enabled: True
  announce-channel: #level-ups
  xp-min: 15
  xp-max: 25
  cooldown: 60
  announce-level: True
  announce-xp: True
```

Options explained:
- **enabled** - Turn the leveling system on or off
- **announce-channel** - Where to send XP and level-up notifications (required for announcements)
- **xp-min** - Minimum XP per message (default: 15)
- **xp-max** - Maximum XP per message (default: 25)
- **cooldown** - Seconds between XP gains (default: 60)
- **announce-level** - Send notification when members level up (default: true)
- **announce-xp** - Send instant notification when members earn XP (default: false)

**Add Level Rewards:**

Give members roles when they reach specific levels:

```
/add-level-role
  level: 5
  role: @Active Member
```

Now when someone reaches level 5, they automatically get the "Active Member" role!

**Check Your Progress:**

```
/rank              # Check your own level
/rank user: @someone   # Check another user's level
```

**View Leaderboard:**

```
/leaderboard       # Top 10 members
/leaderboard limit: 25   # Top 25 members
```

### Setting Up Scheduled Messages

Create automatic recurring announcements:

**Daily Messages:**

```
/schedule-message
  name: daily-reminder
  channel: #announcements
  type: Daily
  time: 14:30
  message: Don't forget to check the rules!
```

**Weekly Messages:**

```
/schedule-message
  name: weekly-event
  channel: #events
  type: Weekly
  time: 18:00
  day-of-week: 5 (Friday)
  message: Weekend event starts now!
```

**Interval Messages:**

```
/schedule-message
  name: status-update
  channel: #status
  type: Interval
  time: 60 (minutes)
  message: Bot is running smoothly!
```

> [!CAUTION]
> All times are in **UTC timezone**. Use 24-hour format (HH:MM) like 14:30 for 2:30 PM or 09:00 for 9:00 AM.

**View Scheduled Messages:**

```
/list-scheduled
```

**Remove Scheduled Messages:**

```
/remove-scheduled
  name: daily-reminder
```

## Important Things to Know

### Multi-Server Support

This bot works across multiple Discord servers simultaneously:
- Each server has completely independent configurations
- XP and levels are tracked separately per server
- Scheduled messages only run in their configured server
- Reaction roles and welcome/leave messages are server-specific
- No interference between servers - they operate independently

### Leveling System

- Members earn XP by chatting (not by spamming - there's a cooldown)
- XP ranges and cooldowns are configurable per server
- Level-up roles are assigned automatically
- All XP data is stored per server (members have different levels in different servers)
- Instant XP notifications show members when they earn points with their total XP
- Level-up announcements celebrate member achievements

### Scheduled Messages

- All times must be in **UTC timezone** (24-hour format: HH:MM)
- Messages activate immediately when created (no bot restart needed)
- Daily messages send at the same time every day
- Weekly messages send on a specific day of the week
- Interval messages repeat every X minutes
- All scheduled messages persist across bot restarts

## When Things Go Wrong

### Leveling System Issues

- **XP not being earned**: Check that leveling is enabled with `/setup-leveling enabled: True`
- **No notifications appearing**: Make sure you set an announce-channel and enabled announcements
- **Roles not being assigned**: Verify the bot's role is higher than the roles it's trying to assign
- **Wrong XP amounts**: Adjust xp-min and xp-max in the setup command

### Scheduled Messages Not Sending

- **Check the time format**: Must be HH:MM in 24-hour format (e.g., 14:30, not 2:30 PM)
- **Verify timezone**: All times are in UTC - calculate your local offset
- **Channel permissions**: Bot needs permission to send messages in the configured channel
- **Check if enabled**: Use `/list-scheduled` to verify the message is active

## Project Structure

Here's how the code is organized:

```
discord-role-guardian/
├── src/
│   ├── commands/              # All the slash command files
│   │   ├── addLevelRole.js       
│   │   ├── leaderboard.js        
│   │   ├── listScheduled.js      
│   │   ├── rank.js               
│   │   └── reset.js
│   │   ├── removeScheduled.js    
│   │   ├── removeReactionRoles.js
|   |   ├── setup.js
│   │   ├── setupLeave.js
│   │   ├── setupWelcome.js
│   │   ├── setupLeveling.js      
│   │   ├── scheduleMessage.js    
│   │   ├── setupReactionRoles.js
|   ├── config/              # Role config logic
│   │   ├── roleConfig.js.js
│   ├── data/                  # Data storage
│   │   ├── storage.js
│   │   └── config.json       # Generated at runtime
│   ├── handlers/              # Event handling logic
│   │   ├── interactionHandler.js
│   │   ├── memberEvents.js
│   │   ├── reactionRoles.js
│   │   ├── levelingSystem.js     
│   │   └── scheduledMessages.js  
│   ├── utils/                 # Helper functions
│   │   ├── activityManager.js
│   │   ├── colors.js
│   │   └── commandRegistry.js
│   └── index.js               # Main bot file
├── .env.example               # Template for .env
├── Dockerfile                 # Docker setup for containerization
├── Makefile                   # Easy commands for running the bot
├── package.json               # Dependencies and scripts
└── README.md                  # You're reading it right now
```

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
