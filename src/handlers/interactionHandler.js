/**
 * Interaction Handler - Process all Discord interactions
 * Handles slash commands, buttons, and shows typing indicator
 */

import { setupReactionRolesCommand } from "../commands/setupReactionRoles.js"
import { setupWelcomeCommand } from "../commands/setupWelcome.js"
import { setupLeaveCommand } from "../commands/setupLeave.js"
import { removeReactionRolesCommand } from "../commands/removeReactionRoles.js"
import { resetCommand } from "../commands/reset.js"
import log from "../utils/colors.js"

/**
 * Map of command names to their handler functions
 */
const commands = {
  "setup-reaction-roles": setupReactionRolesCommand,
  "setup-welcome": setupWelcomeCommand,
  "setup-leave": setupLeaveCommand,
  "remove-reaction-roles": removeReactionRolesCommand,
  reset: resetCommand,
}

/**
 * Handle all interaction events (commands, buttons, etc.)
 * @param {Interaction} interaction - Discord interaction object
 */
export async function handleInteractionCreate(interaction) {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction)
  }

  // Handle button interactions (for future dashboard features)
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction)
  }
}

/**
 * Process slash command execution
 * Shows typing indicator while processing
 * @param {ChatInputCommandInteraction} interaction - Command interaction
 */
async function handleSlashCommand(interaction) {
  const command = commands[interaction.commandName]

  if (!command) {
    log.warn(`Unknown command attempted: ${interaction.commandName}`)
    return interaction.reply({
      content: "Unknown command!",
      flags: 64, // 64 = MessageFlags.Ephemeral
    })
  }

  try {
    // Show typing indicator (bot appears to be typing)
    await interaction.deferReply({ flags: 64 })

    // Simulate processing time (realistic bot behavior)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Execute the command
    await command.execute(interaction)

    log.command(`Command executed: /${interaction.commandName} by ${interaction.user.tag}`)
  } catch (error) {
    log.error(`Error executing /${interaction.commandName}`, error)

    // Send error message to user
    const errorMessage = {
      content: "An error occurred while executing this command! Please check bot permissions and try again.",
    }

    await interaction.editReply(errorMessage)
  }
}

/**
 * Handle button click interactions
 * @param {ButtonInteraction} interaction - Button interaction
 */
async function handleButtonInteraction(interaction) {
  // Placeholder for future dashboard button handlers
  log.event(`Button clicked: ${interaction.customId} by ${interaction.user.tag}`)
}
