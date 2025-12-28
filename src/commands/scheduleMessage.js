/**
 * Schedule Message Command - Create automatic announcements
 * UPDATED: Now supports timezone detection and one-time/daily/weekly/monthly schedules
 * Author: nayandas69
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js"
import { saveScheduledMessage } from "../data/storage.js"
import log from "../utils/colors.js"

export const scheduleMessageCommand = {
  data: new SlashCommandBuilder()
    .setName("schedule-message")
    .setDescription("Schedule a message or announcement")
    .addStringOption((option) =>
      option.setName("name").setDescription("Name for this scheduled message").setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to send the message")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Schedule type")
        .setRequired(true)
        .addChoices(
          { name: "One-time (send once at specified time)", value: "once" },
          { name: "Daily (same time every day)", value: "daily" },
          { name: "Weekly (specific day and time)", value: "weekly" },
          { name: "Monthly (specific day of month and time)", value: "monthly" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("Time in HH:MM format (24-hour) - Uses YOUR local timezone")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("The message content to send").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("timezone-offset")
        .setDescription("Your timezone offset from UTC (e.g., -5 for EST, +5:30 for IST)")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("day-of-week")
        .setDescription("Day of week for weekly (0=Sunday, 1=Monday...6=Saturday)")
        .setMinValue(0)
        .setMaxValue(6)
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("day-of-month")
        .setDescription("Day of month for monthly messages (1-28 recommended for reliability)")
        .setMinValue(1)
        .setMaxValue(31)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false), // Added to ensure command only works in servers

  async execute(interaction) {
    try {
      const name = interaction.options.getString("name")
      const channel = interaction.options.getChannel("channel")
      const type = interaction.options.getString("type")
      const timeInput = interaction.options.getString("time")
      const message = interaction.options.getString("message")
      const dayOfWeek = interaction.options.getInteger("day-of-week")
      const dayOfMonth = interaction.options.getInteger("day-of-month")
      let timezoneOffset = interaction.options.getInteger("timezone-offset")

      if (type === "weekly" && dayOfWeek === null) {
        return interaction.editReply({
          content: "❌ Weekly messages require a day-of-week to be specified!",
        })
      }

      if (type === "monthly" && dayOfMonth === null) {
        return interaction.editReply({
          content: "❌ Monthly messages require a day-of-month to be specified!",
        })
      }

      if (timezoneOffset === null) {
        // Default to UTC if not specified
        timezoneOffset = 0
        log.info(`No timezone specified, defaulting to UTC for user ${interaction.user.tag}`)
      }

      // Validate time format
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeInput)) {
        return interaction.editReply({
          content: "❌ Invalid time format! Use HH:MM in 24-hour format (e.g., 09:00, 14:30, 23:45)",
        })
      }

      const [hours, minutes] = timeInput.split(":").map(Number)

      const schedule = {
        type,
        time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
        timezoneOffset, // Store the user's timezone offset for accurate scheduling
      }

      // Add additional schedule parameters based on type
      if (type === "weekly") {
        schedule.dayOfWeek = dayOfWeek
      } else if (type === "monthly") {
        schedule.dayOfMonth = dayOfMonth
      }

      const recurring = type !== "once"

      // Create scheduled message configuration
      const messageConfig = {
        id: `${interaction.guildId}-${Date.now()}`,
        name,
        guildId: interaction.guildId,
        channelId: channel.id,
        content: message,
        schedule,
        recurring, // One-time messages will not repeat
        enabled: true,
        createdBy: interaction.user.id,
        createdAt: new Date().toISOString(),
      }

      // Save configuration to persistent storage
      saveScheduledMessage(interaction.guildId, messageConfig)

      // Notify the scheduled messages handler to activate this message immediately
      interaction.client.emit("scheduleAdded", messageConfig)

      const timezoneStr = timezoneOffset === 0 ? "UTC" : `UTC${timezoneOffset > 0 ? "+" : ""}${timezoneOffset}`
      let scheduleDesc = ""

      switch (type) {
        case "once":
          scheduleDesc = `Once at ${schedule.time} ${timezoneStr}`
          break
        case "daily":
          scheduleDesc = `Every day at ${schedule.time} ${timezoneStr}`
          break
        case "weekly":
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
          scheduleDesc = `Every ${dayNames[dayOfWeek]} at ${schedule.time} ${timezoneStr}`
          break
        case "monthly":
          scheduleDesc = `Monthly on day ${dayOfMonth} at ${schedule.time} ${timezoneStr}`
          break
      }

      const embed = {
        color: 0x00ff00,
        title: "✅ Scheduled Message Created",
        fields: [
          { name: "Name", value: name, inline: true },
          { name: "Channel", value: `${channel}`, inline: true },
          { name: "Schedule", value: scheduleDesc, inline: false },
          {
            name: "Message",
            value: message.length > 100 ? message.substring(0, 100) + "..." : message,
            inline: false,
          },
        ],
        footer: {
          text: recurring
            ? "This message will repeat automatically according to the schedule"
            : "This message will be sent once and then removed",
        },
        timestamp: new Date().toISOString(),
      }

      await interaction.editReply({ embeds: [embed] })

      log.success(`Scheduled message "${name}" created in ${interaction.guild.name}`)
      log.info(`Schedule type: ${type}, Timezone: ${timezoneStr}`)
      log.info(`Schedule activated immediately - no restart needed`)
    } catch (error) {
      log.error("Error in schedule-message command", error)
      throw error
    }
  },
}
