/**
 * Schedule Message Command - Create automatic announcements
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js"
import { saveScheduledMessage } from "../data/storage.js"
import log from "../utils/colors.js"

export const scheduleMessageCommand = {
  data: new SlashCommandBuilder()
    .setName("schedule-message")
    .setDescription("Schedule a recurring message or announcement")
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
          { name: "Daily (same time every day)", value: "daily" },
          { name: "Weekly (specific day and time)", value: "weekly" },
          { name: "Interval (repeat every X minutes)", value: "interval" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("Time in HH:MM format (24-hour, UTC) or minutes for interval")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message content to send")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("day-of-week")
        .setDescription("Day of week for weekly messages (0=Sunday, 6=Saturday)")
        .setMinValue(0)
        .setMaxValue(6)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const name = interaction.options.getString("name")
      const channel = interaction.options.getChannel("channel")
      const type = interaction.options.getString("type")
      const timeInput = interaction.options.getString("time")
      const message = interaction.options.getString("message")
      const dayOfWeek = interaction.options.getInteger("day-of-week")

      if (type === "weekly" && dayOfWeek === null) {
        return interaction.editReply({
          content: "Weekly messages require a day-of-week to be specified!",
        })
      }

      // Create schedule configuration
      const schedule = { type }

      if (type === "daily" || type === "weekly") {
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeInput)) {
          return interaction.editReply({
            content: "Invalid time format! Use HH:MM in 24-hour format (e.g., 09:00, 14:30, 23:45). All times are in UTC.",
          })
        }
        
        const [hours, minutes] = timeInput.split(":").map(Number)
        schedule.time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        
        if (type === "weekly") {
          schedule.dayOfWeek = dayOfWeek
        }
      } else if (type === "interval") {
        const minutes = parseInt(timeInput)
        if (isNaN(minutes) || minutes < 1) {
          return interaction.editReply({
            content: "Invalid interval! Enter a number of minutes (minimum 1)",
          })
        }
        schedule.interval = minutes
      }

      // Create scheduled message configuration
      const messageConfig = {
        id: `${interaction.guildId}-${Date.now()}`,
        name,
        guildId: interaction.guildId,
        channelId: channel.id,
        content: message,
        schedule,
        recurring: true,
        enabled: true,
        createdBy: interaction.user.id,
        createdAt: new Date().toISOString(),
      }

      // Save configuration
      saveScheduledMessage(interaction.guildId, messageConfig)

      interaction.client.emit('scheduleAdded', messageConfig)

      // Create response
      const scheduleDesc =
        type === "daily"
          ? `Every day at ${schedule.time} UTC`
          : type === "weekly"
            ? `Every ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]} at ${schedule.time} UTC`
            : `Every ${timeInput} minutes`

      const embed = {
        color: 0x00ff00,
        title: "Scheduled Message Created",
        fields: [
          { name: "Name", value: name, inline: true },
          { name: "Channel", value: `${channel}`, inline: true },
          { name: "Schedule", value: scheduleDesc, inline: false },
          { name: "Message", value: message, inline: false },
        ],
        footer: {
          text: "The message is now active and will be sent according to the schedule.",
        },
        timestamp: new Date().toISOString(),
      }

      await interaction.editReply({ embeds: [embed] })

      log.success(`Scheduled message "${name}" created in ${interaction.guild.name}`)
      log.info(`Schedule activated immediately - no restart needed`)
    } catch (error) {
      log.error("Error in schedule-message command", error)
      throw error
    }
  },
}
