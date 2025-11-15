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
- **Support Ticket System** - Let members create private support tickets with just one click. Staff can claim and close tickets, and all conversations are saved as transcripts. Perfect for support servers, community help desks, or any server that needs organized member assistance.
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
- **Database Integration** - PostgreSQL or MongoDB for production deployments
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
- View Channels
- Manage Channels (required for ticket system)
- Manage Roles (required for reaction roles and ticket permissions)
- Send Messages
- Embed Links
- Attach Files (required for ticket transcripts)
- Add Reactions
- Read Message History
- Manage Permissions (required for ticket system)

Copy the URL at the bottom, open it in your browser, and invite Role Guardian to your server.

Quick link (just replace YOUR_CLIENT_ID with your actual client ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=268446928&scope=bot%20applications.commands
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
- `/setup-ticket` - Configure the support ticket system
- `/ticket-stats` - View ticket statistics for your server
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

> [!CAUTION]
> **This action cannot be undone!**
> 
> This command will completely remove:
> - All reaction roles and their configurations
> - Welcome message settings and channels
> - Leave message settings and channels
> - Leveling system configuration
> - All user XP and level data for your server
> - Scheduled messages
> - Ticket system configuration (panel channel, category, staff roles)
> - All ticket data (open and closed tickets)
>
> **What it doesn't remove:**
> - Ticket channels that were already created (you'll need to delete these manually)
> - The ticket panel message (it will remain but won't function without configuration)
>
> **When to use this:**
> - You're reconfiguring the bot from scratch
> - You're troubleshooting issues and want a clean slate
> - You're removing the bot from your server
>
> After running `/reset`, you'll need to set up all features again using their respective setup commands (`/setup-welcome`, `/setup-reaction-role`, `/setup-ticket`, etc.).
>
> **Note:** Only server administrators can use this command.

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

### Setting Up the Support Ticket System

The ticket system lets members get private help from your staff team. When someone creates a ticket, a private channel is automatically created where only they and your staff can talk. It's perfect for support servers, gaming communities, or anywhere you need organized member assistance.

#### Step 1: Prepare Your Server

Before setting up tickets, you need three things ready:

**1. Create a Category for Tickets**

Right-click in your channel list and select "Create Category". Name it something like "Support" or "Tickets". This is where all ticket channels will be created.

**2. Choose a Panel Channel**

Pick a channel where members will click the "Create Ticket" button. Most servers use something like "#support" or "#help".

**3. Set Up Staff Roles**

Make sure you have roles for your support team (like @Support, @Moderator, @Helper). You can assign up to 5 different staff roles!

#### Step 2: Fix Your Bot's Role Position

This is super important - the bot can't work without it:

1. Go to **Server Settings** → **Roles**
2. Find your bot's role (it's usually named after your bot, like "Role Guardian")
3. **Drag it ABOVE all your staff roles** (Support, Moderator, etc.)
4. Click "Save Changes"

Why? Discord bots can only manage roles that are below them in the list. If your bot's role is below your staff roles, tickets won't work.

#### Step 3: Give Your Bot Permissions

Your bot needs special permissions to create and manage ticket channels:

**Option A: Server-Wide Permissions (Easiest)**

1. Go to **Server Settings** → **Roles**
2. Click on your bot's role
3. Enable these permissions:
   - View Channels
   - Manage Channels
   - Manage Permissions
   - Manage Roles
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History

**Option B: Category-Specific Permissions (More Secure)**

1. Right-click your Support category
2. Click "Edit Category" → "Permissions"
3. Click the "+" button and add your bot's role
4. Enable the same permissions listed above

Either way works perfectly - choose what fits your server best!

#### Step 4: Run the Setup Command

Now you're ready to configure the ticket system. In Discord, run:

```
/setup-ticket
  panel-channel: #support
  category: Support
  staff-role-1: @Support
  transcript-channel: #ticket-logs
  embed-color: #5865F2
```

Let me break down each option:

- **panel-channel** - Where the "Create Ticket" button appears (required)
- **category** - The category where ticket channels are created (required)
- **staff-role-1** - Your main support team role (required)
- **staff-role-2, 3, 4, 5** - Additional staff roles (optional)
- **transcript-channel** - Where to save ticket transcripts when closed (optional)
- **embed-color** - Color of the ticket panel embed (optional, default is Discord blue)

**Example with multiple staff roles:**

```
/setup-ticket
  panel-channel: #support
  category: Support
  staff-role-1: @Administrator
  staff-role-2: @Moderator
  staff-role-3: @Support Team
  transcript-channel: #logs
```

Once you hit enter, your bot will post a beautiful ticket panel in the channel you chose!

#### Step 5: How Members Use Tickets

It's super simple for your members:

1. They go to your support channel
2. They click the blue "Create Ticket" button
3. A private channel appears instantly (like #ticket-8357)
4. Only they and your staff can see it
5. They describe their problem
6. Staff helps them out
7. When done, staff or the member clicks "Close Ticket"
8. The transcript gets saved automatically

#### How Staff Manage Tickets

**Claiming Tickets:**

When a new ticket is created, all staff members get pinged. Any staff member or administrator can click "Claim Ticket" to take responsibility for helping that member.

**Closing Tickets:**

Three types of people can close tickets:
- Staff members with any of your configured staff roles
- Server administrators
- The person who created the ticket

Just click the red "Close Ticket" button, and the channel will be archived with a full conversation transcript saved to your logs channel.

#### View Ticket Statistics

Want to see how many tickets your server handles? Run:

```
/ticket-stats
```

This shows you:
- Total tickets created
- Currently open tickets
- Closed tickets
- Most active staff members

#### Troubleshooting Tickets

**"Failed to create ticket channel" Error:**

This means your bot is missing permissions. Double-check:
1. Bot's role is ABOVE all staff roles
2. Bot has "Manage Channels" permission
3. Bot has "Manage Permissions" permission
4. The category actually exists

**"My role must be above the staff role" Error:**

Your bot's role is too low in the hierarchy. Go to Server Settings → Roles and drag your bot's role higher.

**Tickets created but staff can't see them:**

Make sure your staff roles are correctly configured with `/setup-ticket`. The bot gives access to all roles you specified.

**Transcripts not saving:**

Make sure you set a transcript-channel when running `/setup-ticket`. Without it, transcripts are still created but not posted anywhere.

## Important Things to Know

### Multi-Server Support

This bot works across multiple Discord servers simultaneously:
- Each server has completely independent configurations
- XP and levels are tracked separately per server
- Scheduled messages only run in their configured server
- Reaction roles and welcome/leave messages are server-specific
- Ticket systems operate independently with separate transcripts per server
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

### Testing Your Setup

After configuration, test everything:
1. React to your reaction role message - do you get the role?
2. Have a friend join (or use a test account) - does the welcome message appear?
3. Have someone leave - does the goodbye message show up?

### Welcome or Leave Messages Aren't Sending

- Verify the channel is correct
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

### Leveling System Issues

- **XP not being earned**: Check that leveling is enabled with `/setup-leveling enabled: True`
- **No notifications appearing**: Make sure you set an announce-channel and enabled announcements
- **Roles not being assigned**: Verify the bot's role is higher than the roles it's trying to assign
- **Wrong XP amounts**: Adjust xp-min and xp-max in the setup command

### Ticket System Issues

- **Tickets not creating**: Make sure the bot's role is above all staff roles in Server Settings → Roles
- **Permission errors**: Bot needs "Manage Channels" and "Manage Permissions" in the ticket category
- **Staff can't see tickets**: Verify staff roles are correctly set in `/setup-ticket`
- **Can't claim tickets**: Only staff members and administrators can claim tickets
- **Can't close tickets**: Staff, administrators, and the ticket creator can close tickets
- **Transcripts not saving**: Make sure you specified a transcript-channel in the setup

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
│   │   ├── setupTicket.js
│   │   └── ticketStats.js
|   ├── config/              # Role config logic
│   │   ├── roleConfig.js.
│   ├── data/                  # Data storage
│   │   ├── storage.js
│   │   └── config.json       # Generated at runtime
│   ├── handlers/              # Event handling logic
│   │   ├── interactionHandler.js
│   │   ├── memberEvents.js
│   │   ├── reactionRoles.js
│   │   ├── levelingSystem.js     
│   │   ├── scheduledMessages.js
│   │   └── ticketSystem.js
│   ├── utils/                 # Helper functions
│   │   ├── activityManager.js
│   │   ├── colors.js
│   │   └── commandRegistry.js
│   └── index.js               # Main bot file
├── .dockerignore              # Docker ignore file
├── .env.example               # Template for .env
├── .gitignore                 # Files to ignore in git
├── LICENSE                   # License information
├── DEPLOYMENT.md              # Deployment instructions
├── Dockerfile                 # Docker setup for containerization
├── Makefile                   # Easy commands for running the bot
├── package.json               # Dependencies and scripts
├── railway.json                # Railway deployment config
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
