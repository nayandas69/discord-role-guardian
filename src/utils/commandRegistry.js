/**
 * Command Registry - Register slash commands with Discord API
 * Handles automatic command deployment to Discord servers
 */

import { REST, Routes } from "discord.js"
import { setupReactionRolesCommand } from "../commands/setupReactionRoles.js"
import { setupWelcomeCommand } from "../commands/setupWelcome.js"
import { setupLeaveCommand } from "../commands/setupLeave.js"
import { removeReactionRolesCommand } from "../commands/removeReactionRoles.js"
import { resetCommand } from "../commands/reset.js"
import log from "./colors.js"

/**
 * Register all slash commands with Discord
 * @param {Client} client - Discord client instance
 */
export async function registerCommands(client) {
  // Define all available slash commands
  const commands = [
    setupReactionRolesCommand,
    setupWelcomeCommand,
    setupLeaveCommand,
    removeReactionRolesCommand,
    resetCommand,
  ]

  // Convert commands to JSON format for Discord API
  const commandsData = commands.map((cmd) => cmd.data.toJSON())

  // Initialize REST client for Discord API
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN)

  try {
    log.system("Registering slash commands...")

    // Register commands globally or per guild
    if (process.env.GUILD_ID) {
      // Guild-specific (instant update, recommended for development)
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
        body: commandsData,
      })
      log.success(`Registered ${commands.length} commands for guild ${process.env.GUILD_ID}`)
    } else {
      // Global registration (takes up to 1 hour to update)
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsData })
      log.success(`Registered ${commands.length} commands globally (may take up to 1 hour)`)
    }
  } catch (error) {
    log.error("Error registering commands", error)
    throw error
  }
}
