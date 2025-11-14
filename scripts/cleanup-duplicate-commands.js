/**
 * Cleanup Script - Remove Duplicate Guild Commands
 * Run this once to remove old guild-specific commands that cause duplicates in Discord clients.
 * This is only necessary if you previously registered guild-specific commands.
 * Without a GUILD_ID set, the script will not perform any deletions.
 * After running, delete the GUILD_ID from your environment variables to prevent future issues.
 * Note: It may take some time for Discord to reflect these changes due to caching.
 * Listen if you develop on multiple guilds to avoid this in the future.
 * My recommendation is to always use global commands unless you have a specific need for guild-specific ones.
 * Sometimes guild-specific commands are useful for testing, but they should be removed afterward.
 * Usage: node scripts/cleanup-duplicate-commands.js
 */

import { REST, Routes } from "discord.js"
import dotenv from "dotenv"

dotenv.config()

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN)

async function cleanupCommands() {
  try {
    console.log("[INFO] Starting command cleanup...")

    // Get the guild ID from environment if it exists
    const guildId = process.env.GUILD_ID

    if (!guildId) {
      console.log("[WARNING] No GUILD_ID found in environment variables")
      console.log("[INFO] Duplicate commands will disappear in 1-2 hours as Discord cache expires")
      return
    }

    console.log(`[INFO] Removing guild-specific commands from guild: ${guildId}`)

    // Delete all guild-specific commands
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: [] })

    console.log("[SUCCESS] All guild-specific commands removed!")
    console.log("[INFO] Duplicate commands should disappear within 5-10 minutes")
    console.log("[INFO] Global commands are still active and working")
    console.log("\n[ACTION REQUIRED] Go to Railway and DELETE the GUILD_ID variable")
  } catch (error) {
    console.error("[ERROR] Failed to cleanup commands:", error.message)
  }
}

cleanupCommands()
