/**
 * Setup Reaction Roles Command
 * Allows server owners to create reaction role messages
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from "discord.js"
import { saveReactionRoleConfig } from "../data/storage.js"
import { log } from "../utils/colors.js"

export const setupReactionRolesCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-reaction-roles")
    .setDescription("Create a reaction role message")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false) // Added to prevent DM usage
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Channel to send the reaction role message").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("title").setDescription("Title of the reaction role embed").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("description").setDescription("Description for the reaction role message").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("roles")
        .setDescription("Format: emoji1:roleID1,emoji2:roleID2 (e.g., 🔴:123456,🔵:789012)")
        .setRequired(true),
    ),

  /**
   * Execute the setup-reaction-roles command
   * @param {ChatInputCommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel")
    const title = interaction.options.getString("title")
    const description = interaction.options.getString("description")
    const rolesInput = interaction.options.getString("roles")

    log.info(`Processing reaction roles setup in #${channel.name}`)

    // Parse role configuration from user input
    const roleConfig = parseRoleConfig(rolesInput)

    if (!roleConfig || roleConfig.length === 0) {
      log.warn("Invalid role format provided by user")
      return interaction.editReply({
        content: "Invalid role format! Use: emoji:roleID,emoji:roleID\nExample: 🔴:123456789,🔵:987654321",
        flags: MessageFlags.Ephemeral,
      })
    }

    // Validate that roles exist in the server
    const invalidRoles = []
    for (const config of roleConfig) {
      const role = interaction.guild.roles.cache.get(config.roleId)
      if (!role) {
        invalidRoles.push(config.roleId)
      }
    }

    if (invalidRoles.length > 0) {
      log.error(`Invalid role IDs detected: ${invalidRoles.join(", ")}`)
      return interaction.editReply({
        content: `Invalid role IDs: ${invalidRoles.join(", ")}\nMake sure all role IDs are correct!`,
        flags: MessageFlags.Ephemeral,
      })
    }

    // Create embed with role information
    const embed = new EmbedBuilder().setColor("#5865F2").setTitle(title).setDescription(description)

    try {
      // Send reaction role message to specified channel
      const message = await channel.send({ embeds: [embed] })

      // Add all reaction emojis to the message
      for (const config of roleConfig) {
        await message.react(config.emoji)
      }

      const enhancedRoleConfig = roleConfig.map((config) => ({
        ...config,
        guildId: interaction.guild.id,
        channelId: channel.id,
      }))

      // Save configuration to memory for reaction handler
      saveReactionRoleConfig(message.id, enhancedRoleConfig)

      // Confirm success to admin
      await interaction.editReply({
        content: `Reaction role message created in ${channel}!\nMessage ID: ${message.id}`,
        flags: MessageFlags.Ephemeral,
      })

      log.success(`Reaction roles setup in #${channel.name} by ${interaction.user.tag}`)
      log.info(`Message ID: ${message.id}, Roles: ${roleConfig.length}`)
    } catch (error) {
      log.error("Failed to create reaction role message")
      log.error(`Error: ${error.message}`)
      await interaction.editReply({
        content: "Failed to create reaction role message. Check bot permissions!",
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

/**
 * Parse role configuration from user input string
 * @param {string} input - Format: emoji:roleID,emoji:roleID
 * @returns {Array<{emoji: string, roleId: string}>} Parsed configuration
 */
function parseRoleConfig(input) {
  try {
    const pairs = input.split(",").map((pair) => pair.trim())
    return pairs.map((pair) => {
      const [emoji, roleId] = pair.split(":").map((part) => part.trim())
      return { emoji, roleId }
    })
  } catch (error) {
    log.error("Error parsing role configuration")
    log.error(`Details: ${error.message}`)
    return null
  }
}
