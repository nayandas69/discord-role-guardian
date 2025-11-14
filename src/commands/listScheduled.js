/**
 * List Scheduled Messages Command - View all scheduled messages
 */

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { getGuildScheduledMessages } from "../data/storage.js"
import log from "../utils/colors.js"

export const listScheduledCommand = {
  data: new SlashCommandBuilder()
    .setName("list-scheduled")
    .setDescription("View all scheduled messages for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const messages = getGuildScheduledMessages(interaction.guildId)

      if (messages.length === 0) {
        return interaction.editReply({
          content: "No scheduled messages configured! Use `/schedule-message` to create one.",
        })
      }

      // Format message list
      const description = messages
        .map((msg, index) => {
          const scheduleDesc =
            msg.schedule.type === "daily"
              ? `Daily at ${msg.schedule.time}`
              : msg.schedule.type === "weekly"
                ? `Weekly on ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][msg.schedule.dayOfWeek]} at ${msg.schedule.time}`
                : `Every ${msg.schedule.interval} min`

          const status = msg.enabled ? "✅ Active" : "❌ Disabled"

          return `**${index + 1}. ${msg.name}** ${status}\nChannel: <#${msg.channelId}>\nSchedule: ${scheduleDesc}\nMessage: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? "..." : ""}`
        })
        .join("\n\n")

      const embed = {
        color: 0x0099ff,
        title: "Scheduled Messages",
        description,
        footer: {
          text: "Use /remove-scheduled to delete a scheduled message",
        },
        timestamp: new Date().toISOString(),
      }

      await interaction.editReply({ embeds: [embed] })
      log.command(`Scheduled messages listed by ${interaction.user.tag}`)
    } catch (error) {
      log.error("Error in list-scheduled command", error)
      throw error
    }
  },
}
