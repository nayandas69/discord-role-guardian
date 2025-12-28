/**
 * Setup Welcome Message Command
 * Configure welcome messages for new members
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import { saveWelcomeConfig } from "../data/storage.js"
import { log } from "../utils/colors.js"

export const setupWelcomeCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-welcome")
    .setDescription("Setup welcome messages for new members")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Channel to send welcome messages").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Welcome message ({user} = mention, {server} = server name, {count} = member count)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("embed-color").setDescription("Hex color for embed (e.g., #00ff00)").setRequired(false),
    )
    .addChannelOption((option) =>
      option.setName("rules-channel").setDescription("Rules channel to mention in welcome message").setRequired(false),
    )
    .addChannelOption((option) =>
      option.setName("role-channel").setDescription("Role channel to mention in welcome message").setRequired(false),
    ),

  /**
   * Execute the setup-welcome command
   * @param {ChatInputCommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel")
    const message = interaction.options.getString("message")
    const embedColor = interaction.options.getString("embed-color") || "#00ff00"
    const rulesChannel = interaction.options.getChannel("rules-channel")
    const roleChannel = interaction.options.getChannel("role-channel")

    log.info(`Processing welcome setup for #${channel.name}`)

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
        content: "Invalid color format! Use hex format like #00ff00",
        flags: 64,
      })
    }

    // Save welcome configuration
    saveWelcomeConfig(interaction.guildId, {
      channelId: channel.id,
      message: message,
      embedColor: embedColor,
      rulesChannelId: rulesChannel?.id,
      roleChannelId: roleChannel?.id,
      enabled: true,
    })

    // Send preview of welcome message
    const previewEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("Welcome Preview")
      .setDescription(
        message
          .replace("{user}", interaction.user.toString())
          .replace("{server}", interaction.guild.name)
          .replace("{count}", interaction.guild.memberCount.toString())
          .replace("{rules}", rulesChannel ? rulesChannel.toString() : "")
          .replace("{role}", roleChannel ? roleChannel.toString() : ""),
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()

    await interaction.editReply({
      content: `Welcome messages enabled in ${channel}!\n\nPreview:`,
      embeds: [previewEmbed],
      flags: 64,
    })

    log.success(`Welcome messages configured in #${channel.name}`)
    log.info(`Configured by: ${interaction.user.tag}`)
  },
}
