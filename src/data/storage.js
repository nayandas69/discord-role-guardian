/**
 * Data Storage - Persistent file-based storage for bot configuration
 * Automatically saves to JSON file and loads on startup
 * This is ready for future web dashboard integration
 */

import { log } from "../utils/colors.js"
import fs from "fs"
import path from "path"

// Storage file path
const STORAGE_FILE = path.join(process.cwd(), "data", "config.json")

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true })
  log.system("Created data directory for persistent storage")
}

// Storage objects for bot configuration
let reactionRoles = new Map() // messageId -> roleConfig[]
let welcomeConfigs = new Map() // guildId -> welcomeConfig
let leaveConfigs = new Map() // guildId -> leaveConfig

/**
 * Load all configurations from file on startup
 */
export function loadAllConfigs() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, "utf8"))

      if (data.reactionRoles) {
        reactionRoles = new Map(data.reactionRoles)
      }
      if (data.welcomeConfigs) {
        welcomeConfigs = new Map(data.welcomeConfigs)
      }
      if (data.leaveConfigs) {
        leaveConfigs = new Map(data.leaveConfigs)
      }

      log.success("Loaded configurations from persistent storage")
      log.info(
        `Loaded: ${reactionRoles.size} reaction roles, ${welcomeConfigs.size} welcome configs, ${leaveConfigs.size} leave configs`,
      )
    } else {
      log.info("No existing configuration file found, starting fresh")
    }
  } catch (error) {
    log.error("Failed to load configurations from file", error)
  }
}

/**
 * Save all configurations to file
 */
function saveToFile() {
  try {
    const data = {
      reactionRoles: Array.from(reactionRoles.entries()),
      welcomeConfigs: Array.from(welcomeConfigs.entries()),
      leaveConfigs: Array.from(leaveConfigs.entries()),
    }

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), "utf8")
    log.system("Saved configurations to persistent storage")
  } catch (error) {
    log.error("Failed to save configurations to file", error)
  }
}

/**
 * REACTION ROLES STORAGE
 */

/**
 * Save reaction role configuration
 * @param {string} messageId - Discord message ID
 * @param {Array} config - Role configuration array
 */
export function saveReactionRoleConfig(messageId, config) {
  reactionRoles.set(messageId, config)
  saveToFile() // Persist to file
  log.system(`Saved reaction role config for message: ${messageId}`)
  log.info(`Roles configured: ${config.length}`)
}

/**
 * Get reaction role configuration
 * @param {string} messageId - Discord message ID
 * @returns {Array|null} Role configuration or null
 */
export function getReactionRoleConfig(messageId) {
  return reactionRoles.get(messageId) || null
}

/**
 * Remove reaction role configuration
 * @param {string} messageId - Discord message ID
 * @returns {boolean} True if removed, false if not found
 */
export function removeReactionRoleConfig(messageId) {
  const result = reactionRoles.delete(messageId)
  if (result) {
    saveToFile() // Persist to file
    log.system(`Removed reaction role config for message: ${messageId}`)
  }
  return result
}

/**
 * Get all reaction role configurations
 * @returns {Map} All reaction role configs
 */
export function getAllReactionRoleConfigs() {
  return reactionRoles
}

/**
 * WELCOME MESSAGE STORAGE
 */

/**
 * Save welcome message configuration
 * @param {string} guildId - Discord guild ID
 * @param {Object} config - Welcome configuration
 */
export function saveWelcomeConfig(guildId, config) {
  welcomeConfigs.set(guildId, config)
  saveToFile() // Persist to file
  log.system(`Saved welcome config for guild: ${guildId}`)
  log.info(`Channel: ${config.channelId}, Color: ${config.embedColor}`)
}

/**
 * Get welcome message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {Object|null} Welcome config or null
 */
export function getWelcomeConfig(guildId) {
  return welcomeConfigs.get(guildId) || null
}

/**
 * Remove welcome message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {boolean} True if removed, false if not found
 */
export function removeWelcomeConfig(guildId) {
  const result = welcomeConfigs.delete(guildId)
  if (result) {
    saveToFile() // Persist to file
    log.system(`Removed welcome config for guild: ${guildId}`)
  }
  return result
}

/**
 * LEAVE MESSAGE STORAGE
 */

/**
 * Save leave message configuration
 * @param {string} guildId - Discord guild ID
 * @param {Object} config - Leave configuration
 */
export function saveLeaveConfig(guildId, config) {
  leaveConfigs.set(guildId, config)
  saveToFile() // Persist to file
  log.system(`Saved leave config for guild: ${guildId}`)
  log.info(`Channel: ${config.channelId}, Color: ${config.embedColor}`)
}

/**
 * Get leave message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {Object|null} Leave config or null
 */
export function getLeaveConfig(guildId) {
  return leaveConfigs.get(guildId) || null
}

/**
 * Remove leave message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {boolean} True if removed, false if not found
 */
export function removeLeaveConfig(guildId) {
  const result = leaveConfigs.delete(guildId)
  if (result) {
    saveToFile() // Persist to file
    log.system(`Removed leave config for guild: ${guildId}`)
  }
  return result
}

/**
 * RESET ALL CONFIGURATIONS
 */

/**
 * Reset all configurations for a specific guild
 * @param {string} guildId - Discord guild ID
 */
export function resetGuildConfig(guildId) {
  welcomeConfigs.delete(guildId)
  leaveConfigs.delete(guildId)

  // Remove all reaction roles for this guild
  let removedCount = 0
  for (const [messageId, config] of reactionRoles.entries()) {
    if (config[0]?.guildId === guildId) {
      reactionRoles.delete(messageId)
      removedCount++
    }
  }

  saveToFile()
  log.success(`Reset all configurations for guild: ${guildId}`)
  log.info(`Removed: welcome config, leave config, ${removedCount} reaction role configs`)

  return {
    welcomeRemoved: true,
    leaveRemoved: true,
    reactionRolesRemoved: removedCount,
  }
}

/**
 * UTILITY FUNCTIONS FOR FUTURE WEB DASHBOARD
 */

/**
 * Export all configurations (for backup or web dashboard)
 * @returns {Object} All configurations
 */
export function exportAllConfigs() {
  log.info("Exporting all configurations")
  return {
    reactionRoles: Array.from(reactionRoles.entries()),
    welcomeConfigs: Array.from(welcomeConfigs.entries()),
    leaveConfigs: Array.from(leaveConfigs.entries()),
  }
}

/**
 * Import configurations (for restore or web dashboard)
 * @param {Object} data - Configuration data to import
 */
export function importConfigs(data) {
  if (data.reactionRoles) {
    data.reactionRoles.forEach(([key, value]) => reactionRoles.set(key, value))
  }
  if (data.welcomeConfigs) {
    data.welcomeConfigs.forEach(([key, value]) => welcomeConfigs.set(key, value))
  }
  if (data.leaveConfigs) {
    data.leaveConfigs.forEach(([key, value]) => leaveConfigs.set(key, value))
  }
  saveToFile()
  log.success("Configurations imported successfully")
  log.info(
    `Imported: ${data.reactionRoles?.length || 0} reaction roles, ${data.welcomeConfigs?.length || 0} welcome configs, ${data.leaveConfigs?.length || 0} leave configs`,
  )
}
