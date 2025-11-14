/**
 * Reaction Roles Handler
 *
 * Manages the reaction role system where users can react to a message
 * with specific emojis to receive corresponding roles
 *
 * Features:
 * - Dynamic role assignment based on reactions
 * - Automatic role removal when reaction is removed
 * - Handles both cached and uncached reactions
 */

import { EmbedBuilder, ActivityType } from "discord.js"
import { setTemporaryStatus } from "../utils/activityManager.js"
import log from "../utils/colors.js"
import { getReactionRoleConfig } from "../data/storage.js"

/**
 * Role Configuration
 * Map emojis to role IDs
 *
 * To get role IDs: Server Settings -> Roles -> Right click role -> Copy ID
 * To get emojis: Type \:emoji_name: in Discord to see the emoji ID
 */
const REACTION_ROLE_MAP = {}

/**
 * Reaction Role Message ID
 * Stored globally to track the reaction role message
 */
let reactionRoleMessageId = null

/**
 * Setup Reaction Roles
 * Creates or updates the reaction role message in the designated channel
 *
 * @param {Client} client - Discord client instance
 */
export async function setupReactionRoles(client) {
  const channelId = process.env.REACTION_ROLE_CHANNEL_ID

  if (!channelId) {
    log.warn("REACTION_ROLE_CHANNEL_ID not set in .env file")
    return
  }

  try {
    // Fetch the reaction role channel
    const channel = await client.channels.fetch(channelId)

    if (!channel) {
      log.error("Reaction role channel not found")
      return
    }

    // Create an embed message for reaction roles
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🎭 Choose Your Roles")
      .setDescription("React to this message to get your roles!\n\n" + "**Remove your reaction to remove the role!**")
      .setFooter({ text: "React below to get started!" })
      .setTimestamp()

    // Send or update the reaction role message
    let message

    if (reactionRoleMessageId) {
      // Try to fetch existing message
      try {
        message = await channel.messages.fetch(reactionRoleMessageId)
        await message.edit({ embeds: [embed] })
      } catch {
        // Message not found, create new one
        message = await channel.send({ embeds: [embed] })
        reactionRoleMessageId = message.id
      }
    } else {
      // Create new message
      message = await channel.send({ embeds: [embed] })
      reactionRoleMessageId = message.id
    }

    // Add all reaction emojis to the message
    const roleConfig = getReactionRoleConfig(reactionRoleMessageId)
    if (roleConfig) {
      for (const config of roleConfig) {
        await message.react(config.emoji)
      }
    }

    log.success("Reaction roles message created/updated")
  } catch (error) {
    log.error("Error setting up reaction roles", error)
    throw error
  }
}

/**
 * Handle Reaction Add
 * Assigns a role to the user when they react
 *
 * @param {MessageReaction} reaction - The reaction object
 * @param {User} user - The user who reacted
 */
export async function handleReactionAdd(reaction, user) {
  // Ignore bot reactions
  if (user.bot) return

  // If reaction is partial (uncached), fetch full reaction
  if (reaction.partial) {
    try {
      await reaction.fetch()
    } catch (error) {
      log.error("Error fetching reaction", error)
      return
    }
  }

  const roleConfig = getReactionRoleConfig(reaction.message.id)

  // If this message doesn't have reaction roles configured, ignore
  if (!roleConfig) return

  const emoji = reaction.emoji.name

  const roleMapping = roleConfig.find((config) => config.emoji === emoji)

  // Check if emoji is mapped to a role
  if (!roleMapping) return

  const roleId = roleMapping.roleId

  try {
    // Get the guild member
    const member = await reaction.message.guild.members.fetch(user.id)

    // Check if member already has the role
    if (member.roles.cache.has(roleId)) {
      log.info(`${user.tag} already has the role`)
      return
    }

    setTemporaryStatus(`Assigning Role: ${user.username}`, ActivityType.Playing, 4000)

    // Assign the role
    await member.roles.add(roleId)
    log.success(`Assigned role to ${user.tag} (${emoji})`)

    // Optional: Send DM to user (can be disabled if annoying)
    try {
      const role = await reaction.message.guild.roles.fetch(roleId)
      await user.send(`You've been given the **${role.name}** role in **${reaction.message.guild.name}**!`)
    } catch {
      // User has DMs disabled, ignore
      log.info(`Could not DM ${user.tag} (DMs disabled)`)
    }
  } catch (error) {
    log.error(`Error assigning role to ${user.tag}`, error)

    // If role not found, warn in console
    if (error.code === 10011) {
      log.error(`Role ID ${roleId} not found in server`)
    }
  }
}

/**
 * Handle Reaction Remove
 * Removes a role from the user when they unreact
 *
 * @param {MessageReaction} reaction - The reaction object
 * @param {User} user - The user who unreacted
 */
export async function handleReactionRemove(reaction, user) {
  // Ignore bot reactions
  if (user.bot) return

  // If reaction is partial (uncached), fetch full reaction
  if (reaction.partial) {
    try {
      await reaction.fetch()
    } catch (error) {
      log.error("Error fetching reaction", error)
      return
    }
  }

  const roleConfig = getReactionRoleConfig(reaction.message.id)

  // If this message doesn't have reaction roles configured, ignore
  if (!roleConfig) return

  const emoji = reaction.emoji.name

  const roleMapping = roleConfig.find((config) => config.emoji === emoji)

  // Check if emoji is mapped to a role
  if (!roleMapping) return

  const roleId = roleMapping.roleId

  try {
    // Get the guild member
    const member = await reaction.message.guild.members.fetch(user.id)

    // Check if member has the role
    if (!member.roles.cache.has(roleId)) {
      log.info(`${user.tag} doesn't have the role to remove`)
      return
    }

    setTemporaryStatus(`Removing Role: ${user.username}`, ActivityType.Playing, 4000)

    // Remove the role
    await member.roles.remove(roleId)
    log.success(`Removed role from ${user.tag} (${emoji})`)

    // Optional: Send DM to user
    try {
      const role = await reaction.message.guild.roles.fetch(roleId)
      await user.send(`Your **${role.name}** role has been removed in **${reaction.message.guild.name}**.`)
    } catch {
      // User has DMs disabled, ignore
      log.info(`Could not DM ${user.tag} (DMs disabled)`)
    }
  } catch (error) {
    log.error(`Error removing role from ${user.tag}`, error)
  }
}

// Export the reaction role message ID for use in other modules
export function getReactionRoleMessageId() {
  return reactionRoleMessageId
}

export function setReactionRoleMessageId(messageId) {
  reactionRoleMessageId = messageId
}

/**
 * Setup reaction role event listeners
 * @param {Client} client - Discord client instance
 */
export function setupReactionRoleHandler(client) {
  // Handle reaction add (user adds reaction)
  client.on("messageReactionAdd", async (reaction, user) => {
    await handleReactionAdd(reaction, user)
  })

  // Handle reaction remove (user removes reaction)
  client.on("messageReactionRemove", async (reaction, user) => {
    await handleReactionRemove(reaction, user)
  })

  log.success("Reaction role handler initialized")
}
