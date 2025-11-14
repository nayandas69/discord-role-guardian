/**
 * Activity Manager - Rotates bot status/activity automatically
 * Changes bot presence every 2-5 minutes for dynamic appearance
 * Also supports temporary status updates for real-time action indicators
 */

import { ActivityType } from "discord.js"
import log from "./colors.js"

/**
 * List of activities to rotate through
 * Each activity shows below bot name in member list
 */
const activities = [
  { name: "Managing Roles", type: ActivityType.Playing },
  { name: "Welcoming Members", type: ActivityType.Watching },
  { name: "Server Security", type: ActivityType.Watching },
  { name: "/setup-reaction-roles", type: ActivityType.Listening },
  { name: "Member Activity", type: ActivityType.Watching },
  { name: "Role Assignments", type: ActivityType.Playing },
  { name: "Leveling System", type: ActivityType.Playing },
  { name: "Scheduled Messages", type: ActivityType.Playing },
]

let currentActivityIndex = 0
let rotationInterval = null
let clientInstance = null
let isTemporaryStatus = false

/**
 * Start automatic activity rotation
 * @param {Client} client - Discord client instance
 */
export function startActivityRotation(client) {
  clientInstance = client

  // Set initial activity
  updateActivity(client)

  // Rotate activity every 2-5 minutes (random interval)
  rotationInterval = setInterval(
    () => {
      // Only rotate if not showing temporary status
      if (!isTemporaryStatus) {
        updateActivity(client)
      }
    },
    getRandomInterval(2, 5),
  ) // Random time between 2-5 minutes

  log.system("Activity rotation started (2-5 min intervals)")
}

/**
 * Update bot activity/presence
 * @param {Client} client - Discord client instance
 */
function updateActivity(client) {
  const activity = activities[currentActivityIndex]

  client.user.setPresence({
    activities: [activity],
    status: "online", // online, idle, dnd, invisible
  })

  log.event(`Activity updated: ${activity.name}`)

  // Move to next activity (loop back to start if at end)
  currentActivityIndex = (currentActivityIndex + 1) % activities.length
}

/**
 * Set temporary status that shows what bot is currently doing
 * Automatically returns to rotation after specified duration
 * @param {string} statusText - What the bot is doing (e.g., "Processing command...")
 * @param {ActivityType} type - Type of activity (Playing, Watching, Listening, etc.)
 * @param {number} duration - How long to show status in milliseconds (default: 5 seconds)
 */
export function setTemporaryStatus(statusText, type = ActivityType.Playing, duration = 5000) {
  if (!clientInstance || !clientInstance.user) return

  // Mark that we're showing temporary status
  isTemporaryStatus = true

  // Set the temporary status
  clientInstance.user.setPresence({
    activities: [{ name: statusText, type: type }],
    status: "online",
  })

  log.event(`Temporary status: ${statusText}`)

  // Return to rotation after duration
  setTimeout(() => {
    isTemporaryStatus = false
    if (clientInstance && clientInstance.user) {
      updateActivity(clientInstance)
    }
  }, duration)
}

/**
 * Set persistent status (doesn't auto-return to rotation)
 * Useful for long-running operations
 * Call resumeRotation() to return to normal rotation
 * @param {string} statusText - What the bot is doing
 * @param {ActivityType} type - Type of activity
 */
export function setPersistentStatus(statusText, type = ActivityType.Playing) {
  if (!clientInstance || !clientInstance.user) return

  isTemporaryStatus = true

  clientInstance.user.setPresence({
    activities: [{ name: statusText, type: type }],
    status: "online",
  })

  log.event(`Persistent status: ${statusText}`)
}

/**
 * Resume normal activity rotation
 * Call this after setPersistentStatus() when operation is complete
 */
export function resumeRotation() {
  isTemporaryStatus = false
  if (clientInstance && clientInstance.user) {
    updateActivity(clientInstance)
  }
}

/**
 * Generate random interval in milliseconds
 * @param {number} minMinutes - Minimum minutes
 * @param {number} maxMinutes - Maximum minutes
 * @returns {number} Random milliseconds between min and max
 */
function getRandomInterval(minMinutes, maxMinutes) {
  const minMs = minMinutes * 60 * 1000
  const maxMs = maxMinutes * 60 * 1000
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}
