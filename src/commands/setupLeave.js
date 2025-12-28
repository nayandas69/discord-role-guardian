/**
 * Setup Leave Message Command
 * Configure goodbye messages when members leave
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import { saveLeaveConfig } from "../data/storage.js"
import { log } from "../utils/colors.js"

export const setupLeaveCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-leave")
    .setDescription("Setup goodbye messages when members leave")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false) // Added to prevent DM usage
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Channel to send leave messages").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Leave message ({user} = username, {server} = server name)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("embed-color").setDescription("Hex color for embed (e.g., #ff0000)").setRequired(false),
    ),

  /**
   * Execute the setup-leave command
   * @param {ChatInputCommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel")
    const message = interaction.options.getString("message")
    const embedColor = interaction.options.getString("embed-color") || "#ff0000"

    log.info(`Processing leave setup for #${channel.name}`)

    const botPermissions = channel.permissionsFor(interaction.guild.members.me)
    if (!botPermissions || !botPermissions.has("SendMessages") || !botPermissions.has("EmbedLinks")) {
      log.warn(`Bot lacks permissions in #${channel.name}`)
      return interaction.editReply({
        content: `I don't have permission to send messages in ${channel}!\n\nPlease ensure I have these permissions:\n- View Channel\n- Send Messages\n- Embed Links`,
        flags: 64,
      })
    }

    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(embedColor)) {
      log.warn(`Invalid color format provided: ${embedColor}`)
      return interaction.editReply({
        content: "Invalid color format! Use hex format like #ff0000",
        flags: 64,
      })
    }

    // Save leave configuration
    saveLeaveConfig(interaction.guildId, {
      channelId: channel.id,
      message: message,
      embedColor: embedColor,
      enabled: true,
    })

    // Send preview of leave message
    const previewEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("Goodbye Preview")
      .setDescription(message.replace("{user}", interaction.user.username).replace("{server}", interaction.guild.name))
      .setTimestamp()

    await interaction.editReply({
      content: `Leave messages enabled in ${channel}!\n\nPreview:`,
      embeds: [previewEmbed],
      flags: 64,
    })

    log.success(`Leave messages configured in #${channel.name}`)
    log.info(`Configured by: ${interaction.user.tag}`)
  },
}
