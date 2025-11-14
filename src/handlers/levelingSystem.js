/**
 * Leveling System Handler - Reward active members with XP and level-up roles
 * Tracks message activity and awards experience points
 * Automatically assigns roles when members reach specific levels
 * Author: nayandas69
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
      return
    }

    // Check if bot's role is higher than the role being assigned
    if (botMember.roles.highest.position <= role.position) {
      log.error(`Bot role position too low to assign ${role.name}`)
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
 * @param {Message} message - Original message that triggered level up
 * @param {number} newLevel - Newly achieved level
 */
async function sendLevelUpMessage(message, newLevel) {
  try {
    const config = getLevelingConfig(message.guild.id)
    if (!config || !config.announceChannel) return

    const channel = message.guild.channels.cache.get(config.announceChannel)
    if (!channel) return

    setTemporaryStatus(`Level Up: ${message.author.username}`, ActivityType.Watching, 6000)

    // Create level-up announcement embed
    const embed = {
      color: 0x00ff00, // Green color for success
      title: "Level Up!",
      description: `Congratulations ${message.author}! You've reached **Level ${newLevel}**!`,
      fields: [
        {
          name: "Next Level",
          value: `${calculateRequiredXP(newLevel + 1) - calculateRequiredXP(newLevel)} XP needed`,
          inline: true,
        },
      ],
      thumbnail: {
        url: message.author.displayAvatarURL(),
      },
      timestamp: new Date().toISOString(),
    }

    await channel.send({ embeds: [embed] })
    log.event(`Level-up notification sent for ${message.author.tag} (Level ${newLevel})`)
  } catch (error) {
    log.error("Error sending level-up message", error)
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

    const currentLevel = calculateLevel(totalXP)
    const nextLevelXP = calculateRequiredXP(currentLevel + 1)
    const xpNeeded = nextLevelXP - totalXP

    await channel.send({
      content: `${message.author} earned **${xpGained} XP**! Total: **${totalXP} XP** (${xpNeeded} XP until level ${currentLevel + 1})`,
    })
  } catch (error) {
    log.error("Error sending XP gain message", error)
  }
}

/**
 * Process message for XP and leveling
 * Called when a user sends a message in the server
 * @param {Client} client - Discord client instance
 */
export function setupLevelingSystem(client) {
  log.success("Leveling system handler initialized")

  const cooldowns = new Map()

  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return

    const config = getLevelingConfig(message.guild.id)
    if (!config || !config.enabled) return

    const cooldownKey = `${message.author.id}-${message.guild.id}`
    const lastXP = cooldowns.get(cooldownKey) || 0
    const cooldownTime = config.cooldown || 60000

    if (Date.now() - lastXP < cooldownTime) {
      return
    }

    cooldowns.set(cooldownKey, Date.now())

    const xpMin = config.xpMin || 15
    const xpMax = config.xpMax || 25
    const xpGained = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin

    const userData = getUserLevel(message.guild.id, message.author.id)
    const oldLevel = calculateLevel(userData.xp)

    const newXP = addUserXP(message.guild.id, message.author.id, xpGained)
    const newLevel = calculateLevel(newXP)

    if (config.announceXP) {
      await sendXPGainMessage(message, xpGained, newXP)
    }

    if (newLevel > oldLevel) {
      log.info(`${message.author.tag} leveled up to ${newLevel} in ${message.guild.name}`)

      const member = message.guild.members.cache.get(message.author.id)
      if (member) {
        await awardLevelRole(member, newLevel)
      }

      if (config.announceLevel) {
        await sendLevelUpMessage(message, newLevel)
      }
    }
  })

  log.system("Leveling system active - tracking user XP and level-ups")
}
