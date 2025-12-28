/**
 * Setup Ticket Command - Configure ticket system for server
 * Creates ticket panel with button for users to create support tickets
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js"
import { saveTicketConfig } from "../data/storage.js"
import { setupTicketPanel } from "../handlers/ticketSystem.js"
import log from "../utils/colors.js"

export const setupTicketCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Setup the ticket system for support")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false) // Added to prevent DM usage
    .addChannelOption((option) =>
      option
        .setName("panel-channel")
        .setDescription("Channel where the ticket creation panel will be posted")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("Category where ticket channels will be created")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("staff-role-1").setDescription("Primary staff role that can manage tickets").setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("staff-role-2").setDescription("Additional staff role (optional)").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("staff-role-3").setDescription("Additional staff role (optional)").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("staff-role-4").setDescription("Additional staff role (optional)").setRequired(false),
    )
    .addRoleOption((option) =>
      option.setName("staff-role-5").setDescription("Additional staff role (optional)").setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("transcript-channel")
        .setDescription("Channel where ticket transcripts will be saved (optional)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("embed-color").setDescription("Hex color for ticket embeds (e.g., #5865F2)").setRequired(false),
    ),

  /**
   * Execute setup ticket command
   * @param {ChatInputCommandInteraction} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      const panelChannel = interaction.options.getChannel("panel-channel")
      const category = interaction.options.getChannel("category")

      const staffRoles = []
      for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`staff-role-${i}`)
        if (role) staffRoles.push(role)
      }

      const transcriptChannel = interaction.options.getChannel("transcript-channel")
      const embedColor = interaction.options.getString("embed-color") || "#5865F2"

      // Validate hex color format
      const hexColorRegex = /^#[0-9A-F]{6}$/i
      if (!hexColorRegex.test(embedColor)) {
        return interaction.editReply({
          content: "Invalid color format! Please use hex format like #5865F2",
        })
      }

      // Check panel channel permissions
      const panelPermissions = panelChannel.permissionsFor(interaction.guild.members.me)
      if (
        !panelPermissions.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
        ])
      ) {
        return interaction.editReply({
          content: `I need these permissions in ${panelChannel}:\n• View Channel\n• Send Messages\n• Embed Links`,
        })
      }

      // Check category permissions
      const botPermissions = category.permissionsFor(interaction.guild.members.me)
      const requiredPerms = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageRoles,
      ]

      if (!botPermissions.has(requiredPerms)) {
        return interaction.editReply({
          content:
            `I need these permissions in the **${category.name}** category:\n` +
            `• View Channel\n` +
            `• Manage Channels\n` +
            `• Send Messages\n` +
            `• Manage Roles (for channel permissions)\n\n` +
            `**How to fix:**\n` +
            `1. Go to Server Settings → Roles\n` +
            `2. Find my role and ensure it has these permissions\n` +
            `3. Right-click the **${category.name}** category → Edit Category\n` +
            `4. Go to Permissions and add my role with the permissions above`,
        })
      }

      const botRole = interaction.guild.members.me.roles.highest
      const roleHierarchyIssues = []

      for (const staffRole of staffRoles) {
        if (staffRole.position >= botRole.position) {
          roleHierarchyIssues.push(`• **${staffRole.name}** (Position: ${staffRole.position})`)
        }
      }

      if (roleHierarchyIssues.length > 0) {
        return interaction.editReply({
          content:
            `**Role Hierarchy Issue!**\n\n` +
            `My highest role: **${botRole.name}** (Position: ${botRole.position})\n\n` +
            `My role must be positioned **above** these staff roles:\n${roleHierarchyIssues.join("\n")}\n\n` +
            `**How to fix:**\n` +
            `1. Go to Server Settings → Roles\n` +
            `2. Find the **${botRole.name}** role (my role)\n` +
            `3. Drag it **above** all staff roles\n` +
            `4. Click "Save Changes"\n` +
            `5. Try the command again`,
        })
      }

      const config = {
        panelChannelId: panelChannel.id,
        categoryId: category.id,
        staffRoleIds: staffRoles.map((r) => r.id), // Array of role IDs instead of single role
        transcriptChannelId: transcriptChannel?.id || null,
        embedColor: embedColor,
        enabled: true,
        ticketCount: 0,
      }

      saveTicketConfig(interaction.guild.id, config)

      // Setup ticket panel
      await setupTicketPanel(
        interaction.guild,
        panelChannel.id,
        category.id,
        staffRoles.map((r) => r.id),
        embedColor,
      )

      const staffRolesList = staffRoles.map((r) => r.toString()).join(", ")

      await interaction.editReply({
        content:
          `✅ **Ticket System Configured!**\n\n` +
          `📋 **Settings:**\n` +
          `• Panel Channel: ${panelChannel}\n` +
          `• Ticket Category: ${category.name}\n` +
          `• Staff Roles (${staffRoles.length}): ${staffRolesList}\n` +
          `• Transcript Channel: ${transcriptChannel || "None"}\n` +
          `• Embed Color: ${embedColor}\n\n` +
          `Users can now create tickets by clicking the button in ${panelChannel}!`,
      })

      log.command(`Ticket system setup by ${interaction.user.tag} in ${interaction.guild.name}`)
      log.info(`Staff roles configured: ${staffRoles.map((r) => r.name).join(", ")}`)
    } catch (error) {
      log.error("Error in setup-ticket command", error)

      const errorMessage =
        `**An error occurred while setting up the ticket system!**\n\n` +
        `**Common causes:**\n` +
        `• Bot missing permissions in the category\n` +
        `• Bot role is below the staff roles\n` +
        `• Invalid category or channel selected\n\n` +
        `**Error details:** ${error.message}`

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMessage })
      } else {
        await interaction.reply({ content: errorMessage, flags: 64 })
      }
    }
  },
}
