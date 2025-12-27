# Scripts Documentation

This folder contains utility scripts for maintaining and managing the Discord Role Guardian bot.

## Available Scripts

### cleanup-duplicate-commands.js

**Purpose:** Removes duplicate slash commands that appear in Discord when the bot is under development or after migrating from guild-specific to global command registration.

**When to Use:**
- You see duplicate commands in Discord (each command appears 2 or more times)
- After switching from single-server to multi-server bot configuration
- When old guild-specific commands are still cached in Discord

**Usage:**

```bash
node scripts/cleanup-duplicate-commands.js
```

**Requirements:**
- Your `.env` file must contain `DISCORD_TOKEN` and `CLIENT_ID`
- If `GUILD_ID` is present in `.env`, the script will remove guild-specific commands from that server
- If no `GUILD_ID` is found, duplicates will naturally expire in 1-2 hours

**What It Does:**
1. Connects to Discord API using your bot token
2. Finds all guild-specific commands registered to your server
3. Deletes them to remove duplicates
4. Keeps global commands active and working

**Expected Output:**

```
[INFO] Starting command cleanup...
[INFO] Removing guild-specific commands from guild: 1234567890
[SUCCESS] All guild-specific commands removed!
[INFO] Duplicate commands should disappear within 5-10 minutes
[INFO] Global commands are still active and working

[ACTION REQUIRED] Go to Railway and DELETE the GUILD_ID variable
```

**After Running:**
- Wait 5-10 minutes for Discord to sync
- Delete the `GUILD_ID` variable from Railway/Vercel/your hosting provider
- Duplicate commands will disappear from Discord
- Your bot will continue working normally with global commands

**Troubleshooting:**

**Error: "Invalid token"**
- Check that `DISCORD_TOKEN` in your `.env` file is correct
- Ensure the token hasn't expired

**Error: "Missing CLIENT_ID"**
- Add `CLIENT_ID` to your `.env` file
- Get it from Discord Developer Portal

**Duplicates still showing after 10 minutes**
- Clear Discord cache: Settings > Advanced > Clear Cache
- Restart Discord completely
- Wait up to 1 hour for Discord's global cache to update

**No GUILD_ID warning**
- This means your bot is already configured correctly for multi-server
- Duplicates will disappear naturally in 1-2 hours
- No further action needed

## remove.cjs

**Purpose:** Removes all global slash commands registered by the bot.
- Useful for resetting commands or cleaning up before a fresh deployment.
- Make sure to re-register commands after running this script.

**Usage:**
```bash
node scripts/remove.cjs
```

---

## Adding New Scripts

When adding new scripts to this folder:

1. Create the script file with a descriptive name
2. Add proper comments and usage instructions at the top
3. Document it in this README.md
4. Use ES6 modules (import/export) for consistency
5. Include error handling and informative console logs
