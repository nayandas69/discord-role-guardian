/**
 * Leveling System Handler - Reward active members with XP and level-up roles
 * Tracks message activity and awards experience points
 * Automatically assigns roles when members reach specific levels
 * Author: nayandas69
 * 
 * Features:
 * - Comprehensive permission checks before any Discord API calls
 * - Graceful error handling with detailed logging
 * - Fallback mechanisms when permissions are missing
 * - Memory-efficient cooldown management
 */

import { PermissionsBitField, ActivityType } from "discord.js"
import { getUserLevel, addUserXP, getLevelingConfig } from "../data/storage.js"
import { setTemporaryStatus } from "../utils/activityManager.js"
import log from "../utils/colors.js"

/**
 * Calculate required XP for a specific level
 * Uses a progressive formula so higher levels require more XP
 * @param {number} level - Target level
 * @returns {number} Required XP amount
 */
function calculateRequiredXP(level) {
  // Formula: level * level * 100
  // Level 1 = 100 XP, Level 2 = 400 XP, Level 3 = 900 XP, etc.
  return level * level * 100
}

/**
 * Calculate user's level based on total XP
 * @param {number} totalXP - User's total experience points
 * @returns {number} Current level
 */
function calculateLevel(totalXP) {
  let level = 0
  while (totalXP >= calculateRequiredXP(level + 1)) {
    level++
  }
  return level
}

/**
 * Check if bot has required permissions in a channel
 * Prevents DiscordAPIError[50013]: Missing Permissions
 * @param {Channel} channel - Discord channel to check
 * @param {Array<string>} permissions - Required permission flags
 * @returns {Object} { hasPermission: boolean, missing: Array<string> }
 */
function checkBotPermissions(channel, permissions = []) {
  try {
    if (!channel || !channel.guild) {
      return { hasPermission: false, missing: ["Invalid channel"] }
    }

    const botMember = channel.guild.members.me
    if (!botMember) {
      return { hasPermission: false, missing: ["Bot not in guild"] }
    }

    const channelPermissions = channel.permissionsFor(botMember)
    if (!channelPermissions) {
      return { hasPermission: false, missing: ["Cannot read channel permissions"] }
    }

    const missing = []
    for (const permission of permissions) {
      if (!channelPermissions.has(permission)) {
        missing.push(permission)
      }
    }

    return {
      hasPermission: missing.length === 0,
      missing: missing,
    }
  } catch (error) {
    log.error("Error checking bot permissions", error)
    return { hasPermission: false, missing: ["Permission check failed"] }
  }
}

/**
 * Award level-up role to member if configured
 * @param {GuildMember} member - Discord guild member
 * @param {number} newLevel - Newly achieved level
 */
async function awardLevelRole(member, newLevel) {
  try {
    const config = getLevelingConfig(member.guild.id)
    if (!config || !config.levelRoles) return

    setTemporaryStatus(`Awarding Level ${newLevel} Role`, ActivityType.Playing, 5000)

    // Find role configuration for this level
    const roleConfig = config.levelRoles.find((r) => r.level === newLevel)
    if (!roleConfig) return

    // Get the role object
    const role = member.guild.roles.cache.get(roleConfig.roleId)
    if (!role) {
      log.warn(`Level ${newLevel} role not found: ${roleConfig.roleId}`)
      return
    }

    // Check bot permissions before assigning role
    const botMember = member.guild.members.me
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      log.error("Bot missing MANAGE_ROLES permission for leveling system")
      log.warn(`Cannot assign ${role.name} to ${member.user.tag} - missing permissions`)
      return
    }

    // Check if bot's role is higher than the role being assigned
    if (botMember.roles.highest.position <= role.position) {
      log.error(`Bot role position too low to assign ${role.name}`)
      log.warn(`Move bot's role above ${role.name} in server settings`)
      return
    }

    if (member.roles.cache.has(role.id)) {
      log.info(`${member.user.tag} already has ${role.name}, skipping assignment`)
      return
    }

    // Assign the role
    await member.roles.add(role)
    log.success(`Awarded ${role.name} to ${member.user.tag} for reaching level ${newLevel}`)
  } catch (error) {
    log.error("Error awarding level role", error)
  }
}

/**
 * Send level-up notification to channel
 * Production-ready with comprehensive permission validation
 * @param {Message} message - Original message that triggered level up
 * @param {number} newLevel - Newly achieved level
 */
async function sendLevelUpMessage(message, newLevel) {
  try {
    const config = getLevelingConfig(message.guild.id)
    
    // Check if announcements are enabled
    if (!config || !config.announceChannel) {
      log.info("Level-up announcements not configured, skipping notification")
      return
    }

    // Get the announcement channel
    const channel = message.guild.channels.cache.get(config.announceChannel)
    if (!channel) {
      log.warn(`Announcement channel ${config.announceChannel} not found`)
      log.warn("Please reconfigure leveling system with /setup-leveling")
      return
    }

    const requiredPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks,
    ]

    const permCheck = checkBotPermissions(channel, requiredPermissions)
    if (!permCheck.hasPermission) {
      log.error(`Missing permissions in ${channel.name}: ${permCheck.missing.join(", ")}`)
      log.warn(`Grant bot these permissions: ${permCheck.missing.join(", ")}`)
      log.warn("Level-up notification skipped due to missing permissions")
      return
    }

    setTemporaryStatus(`Level Up: ${message.author.username}`, ActivityType.Watching, 6000)

    const currentLevelXP = calculateRequiredXP(newLevel)
    const nextLevelXP = calculateRequiredXP(newLevel + 1)
    const xpNeededForNext = nextLevelXP - currentLevelXP

    // Create level-up announcement embed
    const embed = {
      color: 0x00ff00, // Green color for success
      title: "🏆 Level Up!",
      description: `Congratulations ${message.author}! You've reached **Level ${newLevel}**!`,
      fields: [
        {
          name: "𝐋𝑉 Progress",
          value: `You now have **${currentLevelXP} XP**`,
          inline: true,
        },
        {
          name: "🎯 Next Level",
          value: `${xpNeededForNext} XP needed for Level ${newLevel + 1}`,
          inline: true,
        },
      ],
      thumbnail: {
        url: message.author.displayAvatarURL({ dynamic: true }),
      },
      footer: {
        text: `Keep chatting to earn more XP! • ${message.guild.name}`,
      },
      timestamp: new Date().toISOString(),
    }

    await channel.send({ embeds: [embed] })
    log.event(`Level-up notification sent for ${message.author.tag} (Level ${newLevel})`)
  } catch (error) {
    if (error.code === 50013) {
      log.error(`Missing Permissions to send level-up message in ${message.guild.name}`)
      log.warn("Check bot role permissions: View Channel, Send Messages, Embed Links")
    } else if (error.code === 10003) {
      log.error("Announcement channel was deleted, please reconfigure with /setup-leveling")
    } else {
      log.error("Error sending level-up message", error)
    }
  }
}

/**
 * Send XP gain notification to channel
 * Added XP gain announcement so users know when they earn XP
 * @param {Message} message - Original message
 * @param {number} xpGained - Amount of XP earned
 * @param {number} totalXP - Total XP after gain
 */
async function sendXPGainMessage(message, xpGained, totalXP) {
  try {
    const config = getLevelingConfig(message.guild.id)
    if (!config || !config.announceChannel || !config.announceXP) return

    const channel = message.guild.channels.cache.get(config.announceChannel)
    if (!channel) return

    const requiredPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
    ]

    const permCheck = checkBotPermissions(channel, requiredPermissions)
    if (!permCheck.hasPermission) {
      return
    }

    const currentLevel = calculateLevel(totalXP)
    const nextLevelXP = calculateRequiredXP(currentLevel + 1)
    const xpNeeded = nextLevelXP - totalXP

    await channel.send({
      content: `${message.author} earned **+${xpGained} XP**! Total: **${totalXP} XP** (${xpNeeded} XP until Level ${currentLevel + 1})`,
    })
  } catch (error) {
    // These are frequent messages and shouldn't flood error logs
    if (error.code === 50013) {
      log.warn("Missing permissions for XP announcements, disabling temporarily")
    }
  }
}

/**
 * Process message for XP and leveling
 * Called when a user sends a message in the server
 * Production-ready with memory management and error handling
 * @param {Client} client - Discord client instance
 */
export function setupLevelingSystem(client) {
  log.success("Leveling system handler initialized")

  const cooldowns = new Map()

  const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
  setInterval(() => {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, timestamp] of cooldowns.entries()) {
      // Remove cooldowns older than 10 minutes
      if (now - timestamp > 10 * 60 * 1000) {
        cooldowns.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      log.system(`Cleaned ${cleanedCount} expired cooldown entries from memory`)
    }
  }, CLEANUP_INTERVAL)

  client.on("messageCreate", async (message) => {
    if (!message || message.author.bot || !message.guild || !message.author) return

    const config = getLevelingConfig(message.guild.id)
    if (!config || !config.enabled) return

    const cooldownKey = `${message.author.id}-${message.guild.id}`
    const lastXP = cooldowns.get(cooldownKey) || 0
    const cooldownTime = config.cooldown || 60000 // Default 60 seconds

    // Check if user is still in cooldown period
    if (Date.now() - lastXP < cooldownTime) {
      return
    }

    // Update cooldown timestamp
    cooldowns.set(cooldownKey, Date.now())

    const xpMin = config.xpMin || 15
    const xpMax = config.xpMax || 25
    const xpGained = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin

    // Get user's current level data
    const userData = getUserLevel(message.guild.id, message.author.id)
    const oldLevel = calculateLevel(userData.xp)

    // Add XP and get new total
    const newXP = addUserXP(message.guild.id, message.author.id, xpGained)
    const newLevel = calculateLevel(newXP)

    if (config.announceXP && newLevel === oldLevel) {
      await sendXPGainMessage(message, xpGained, newXP)
    }

    if (newLevel > oldLevel) {
      log.info(`${message.author.tag} leveled up to ${newLevel} in ${message.guild.name}`)

      const member = message.guild.members.cache.get(message.author.id)
      if (member) {
        await awardLevelRole(member, newLevel)
      } else {
        log.warn(`Member ${message.author.tag} not found in cache, skipping role award`)
      }

      if (config.announceLevel) {
        await sendLevelUpMessage(message, newLevel)
      }
    }
  })

  log.system("Leveling system active - tracking user XP and level-ups")
  log.info("Permission checks enabled - graceful error handling active")
}
