/**
 * Scheduled Messages Handler - Automatic announcements and reminders
 * Allows server admins to schedule recurring messages
 * Supports daily, weekly, and custom interval messages
 * Author: nayandas69
 */

import { getScheduledMessages } from "../data/storage.js"
import { ActivityType } from "discord.js"
import { setTemporaryStatus } from "../utils/activityManager.js"
import log from "../utils/colors.js"

// Store active timers so they can be cleared on bot restart
const activeTimers = new Map()

/**
 * Calculate next execution time for scheduled message
 * @param {Object} schedule - Schedule configuration
 * @returns {number} Milliseconds until next execution
 */
function calculateNextExecution(schedule) {
  const now = new Date()
  let nextExecution = new Date()

  switch (schedule.type) {
    case "daily":
      // Parse time in format "HH:MM"
      const [hours, minutes] = schedule.time.split(":").map(Number)
      nextExecution.setHours(hours, minutes, 0, 0)

      // If time has passed today, schedule for tomorrow
      if (nextExecution <= now) {
        nextExecution.setDate(nextExecution.getDate() + 1)
      }
      break

    case "weekly":
      // schedule.dayOfWeek: 0 = Sunday, 6 = Saturday
      const [weekHours, weekMinutes] = schedule.time.split(":").map(Number)
      const currentDay = now.getDay()
      let daysUntilNext = schedule.dayOfWeek - currentDay

      if (daysUntilNext < 0 || (daysUntilNext === 0 && now.getHours() >= weekHours)) {
        daysUntilNext += 7
      }

      nextExecution.setDate(now.getDate() + daysUntilNext)
      nextExecution.setHours(weekHours, weekMinutes, 0, 0)
      break

    case "interval":
      // schedule.interval in minutes
      nextExecution = new Date(now.getTime() + schedule.interval * 60000)
      break

    default:
      log.error(`Unknown schedule type: ${schedule.type}`)
      return null
  }

  return nextExecution.getTime() - now.getTime()
}

/**
 * Execute a scheduled message
 * @param {Client} client - Discord client instance
 * @param {Object} messageConfig - Message configuration
 */
async function executeScheduledMessage(client, messageConfig) {
  try {
    setTemporaryStatus(`Sending: ${messageConfig.name}`, ActivityType.Playing, 6000)

    // Find the target channel
    const channel = client.channels.cache.get(messageConfig.channelId)
    if (!channel) {
      log.error(`Scheduled message channel not found: ${messageConfig.channelId}`)
      return
    }

    // Check bot permissions
    if (!channel.permissionsFor(client.user).has("SendMessages")) {
      log.error(`Bot missing send messages permission in ${channel.name}`)
      return
    }

    // Create message content
    const messageData = {}

    // Add text content if provided
    if (messageConfig.content) {
      messageData.content = messageConfig.content
    }

    // Add embed if configured
    if (messageConfig.embed) {
      messageData.embeds = [
        {
          color: parseInt(messageConfig.embed.color.replace("#", ""), 16) || 0x0099ff,
          title: messageConfig.embed.title,
          description: messageConfig.embed.description,
          timestamp: new Date().toISOString(),
          footer: messageConfig.embed.footer
            ? { text: messageConfig.embed.footer }
            : { text: "Scheduled Message" },
        },
      ]
    }

    // Send the message
    await channel.send(messageData)
    log.success(`Sent scheduled message to ${channel.name} in ${channel.guild.name}`)

    // Reschedule if this is a recurring message
    if (messageConfig.recurring) {
      scheduleMessage(client, messageConfig)
    }
  } catch (error) {
    log.error("Error executing scheduled message", error)
  }
}

/**
 * Schedule a message for future execution
 * @param {Client} client - Discord client instance
 * @param {Object} messageConfig - Message configuration
 */
function scheduleMessage(client, messageConfig) {
  const existingTimer = activeTimers.get(messageConfig.id)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const delay = calculateNextExecution(messageConfig.schedule)
  if (!delay) return

  const nextTime = new Date(Date.now() + delay)
  log.system(
    `Scheduled message "${messageConfig.name}" will execute at ${nextTime.toLocaleString()}`,
  )

  const timer = setTimeout(() => {
    executeScheduledMessage(client, messageConfig)
  }, delay)

  activeTimers.set(messageConfig.id, timer)
}

/**
 * Initialize scheduled messages system
 * @param {Client} client - Discord client instance
 */
export function setupScheduledMessages(client) {
  log.success("Scheduled messages handler initialized")

  const allScheduled = getScheduledMessages()

  for (const [guildId, messages] of allScheduled) {
    for (const message of messages) {
      if (message.enabled) {
        scheduleMessage(client, message)
      }
    }
  }

  client.on('scheduleAdded', (messageConfig) => {
    log.info(`Activating new scheduled message: ${messageConfig.name}`)
    scheduleMessage(client, messageConfig)
  })

  log.system(`Loaded ${allScheduled.size} scheduled message configurations`)
  log.info("Scheduled messages active - automatic announcements enabled")
}

/**
 * Cancel a specific scheduled message
 * @param {string} messageId - Message ID to cancel
 */
export function cancelScheduledMessage(messageId) {
  const timer = activeTimers.get(messageId)
  if (timer) {
    clearTimeout(timer)
    activeTimers.delete(messageId)
    log.info(`Cancelled scheduled message: ${messageId}`)
    return true
  }
  return false
}

/**
 * Cancel all scheduled messages (for graceful shutdown)
 */
export function cancelAllScheduledMessages() {
  for (const [id, timer] of activeTimers) {
    clearTimeout(timer)
  }
  activeTimers.clear()
  log.system("All scheduled messages cancelled")
}
