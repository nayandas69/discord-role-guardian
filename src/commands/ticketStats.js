/**
 * Ticket Stats Command - View ticket system statistics
 * Shows total tickets, active tickets, and closed tickets
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import { getTicketConfig } from "../data/storage.js"
import { getTicketStats } from "../handlers/ticketSystem.js"
import log from "../utils/colors.js"

export const ticketStatsCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket-stats")
    .setDescription("View ticket system statistics")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false), // Added to prevent DM usage

  /**
   * Execute ticket stats command
   * @param {ChatInputCommandInteraction} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      const guildId = interaction.guild.id

      // Check if ticket system is configured
      const config = getTicketConfig(guildId)
      if (!config) {
        return interaction.editReply({
          content: "Ticket system is not configured for this server. Use `/setup-ticket` to get started.",
        })
      }

      // Get ticket statistics
      const stats = getTicketStats(guildId)

      // Create stats embed
      const embed = new EmbedBuilder()
        .setTitle("Ticket System Statistics")
        .setDescription(
          `**Total Tickets:** ${stats.totalTickets}\n` +
            `**Active Tickets:** ${stats.activeTickets}\n` +
            `**Closed Tickets:** ${stats.closedTickets}\n\n` +
            `**Configuration:**\n` +
            `• Panel Channel: <#${config.panelChannelId}>\n` +
            `• Ticket Category: ${interaction.guild.channels.cache.get(config.categoryId)?.name || "Unknown"}\n` +
            `• Staff Role: <@&${config.staffRoleId}>\n` +
            `• Transcript Channel: ${config.transcriptChannelId ? `<#${config.transcriptChannelId}>` : "None"}\n` +
            `• Status: ${config.enabled ? "✅ Enabled" : "❌ Disabled"}`,
        )
        .setColor(config.embedColor)
        .setTimestamp()

      await interaction.editReply({
        embeds: [embed],
      })

      log.command(`Ticket stats viewed by ${interaction.user.tag} in ${interaction.guild.name}`)
    } catch (error) {
      log.error("Error in ticket-stats command", error)
      throw error
    }
  },
}
