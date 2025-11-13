/**
 * Activity Manager - Rotates bot status/activity automatically
 * Changes bot presence every 2-5 minutes for dynamic appearance
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
]

let currentActivityIndex = 0

/**
 * Start automatic activity rotation
 * @param {Client} client - Discord client instance
 */
export function startActivityRotation(client) {
  // Set initial activity
  updateActivity(client)

  // Rotate activity every 2-5 minutes (random interval)
  setInterval(
    () => {
      updateActivity(client)
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
