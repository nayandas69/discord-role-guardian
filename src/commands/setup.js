/**
 * Slash Commands Setup
 *
 * Registers slash commands for the bot
 * Allows server admins to configure bot features
 */

import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from "discord.js"

/**
 * Register Slash Commands
 * Creates and registers application commands with Discord
 *
 * @param {Client} client - Discord client instance
 */
export async function registerCommands(client) {
  // Define slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName("setup-roles")
      .setDescription("Setup or refresh the reaction roles message")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),
  ]

  // Create REST client for Discord API
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN)

  try {
    console.log("🔄 Registering slash commands...")

    // Register commands globally or per guild
    if (process.env.GUILD_ID) {
      // Guild-specific commands (faster updates, recommended for testing)
      await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands })
      console.log("✅ Guild commands registered")
    } else {
      // Global commands (takes up to 1 hour to propagate)
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands })
      console.log("✅ Global commands registered")
    }
  } catch (error) {
    console.error("❌ Error registering commands:", error)
    throw error
  }
}
