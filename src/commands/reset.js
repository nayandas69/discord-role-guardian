/**
 * Reset Command - Reset all bot configurations for the server
 */

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { resetGuildConfig } from "../data/storage.js"
import { log } from "../utils/colors.js"

const data = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("Reset all bot configurations for this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false)

/**
 * Execute reset command
 * @param {Interaction} interaction - Discord interaction object
 */
async function execute(interaction) {
  try {
    const guildId = interaction.guildId
    const guildName = interaction.guild.name

    // Reset all configurations
    const result = resetGuildConfig(guildId)

    log.command(`Reset command used in guild: ${guildName}`)

    // Send confirmation message
    await interaction.editReply({
      content:
        `**Reset Complete**\n\nAll bot configurations have been reset for this server:\n\n` +
        `• Welcome messages: Removed\n` +
        `• Leave messages: Removed\n` +
        `• Reaction roles: Removed ${result.reactionRolesRemoved} configuration(s)\n\n` +
        `You can now set up the bot again using the setup commands.`,
    })

    log.success(`Successfully reset all configurations for guild: ${guildName}`)
  } catch (error) {
    log.error("Error executing reset command", error)

    const errorMessage = "Failed to reset bot configurations. Please try again."

    await interaction.editReply({ content: errorMessage })
  }
}

export const resetCommand = {
  data,
  execute,
}
