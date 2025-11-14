/**
 * Member Events Handler
 *
 * Manages welcome and leave messages for server members
 *
 * Features:
 * - Customizable welcome messages with user mentions
 * - Leave/goodbye messages
 * - Server statistics in messages
 * - Beautiful embeds
 */

import { EmbedBuilder, ActivityType } from "discord.js"
import { setTemporaryStatus } from "../utils/activityManager.js"
import log from "../utils/colors.js"
import { getWelcomeConfig, getLeaveConfig } from "../data/storage.js"

/**
 * Handle Member Join
 * Sends a welcome message when a new member joins the server
 *
 * @param {GuildMember} member - The member who joined
 */
export async function handleMemberJoin(member) {
  try {
    const welcomeConfig = getWelcomeConfig(member.guild.id)

    if (!welcomeConfig || !welcomeConfig.channelId) {
      log.info(`No welcome channel configured for guild: ${member.guild.name}`)
      return
    }

    setTemporaryStatus(`Welcoming ${member.user.username}`, ActivityType.Watching, 5000)

    // Fetch the welcome channel
    const channel = await member.guild.channels.fetch(welcomeConfig.channelId).catch(() => null)

    if (!channel) {
      log.error("Welcome channel not found or bot lacks access")
      return
    }

    const botPermissions = channel.permissionsFor(member.guild.members.me)
    if (!botPermissions || !botPermissions.has("SendMessages") || !botPermissions.has("EmbedLinks")) {
      log.error(
        `Missing permissions in #${channel.name}. Bot needs: Send Messages, Embed Links, View Channel permissions`,
      )
      return
    }

    // Get member count
    const memberCount = member.guild.memberCount

    // Create welcome embed with custom message if provided
    const welcomeEmbed = new EmbedBuilder()
      .setColor(welcomeConfig.embedColor || "#57F287") // Use saved color or default green
      .setTitle("Welcome to the Server!")
      .setDescription(
        welcomeConfig.message
          ? welcomeConfig.message
              .replace("{user}", member.toString())
              .replace("{server}", member.guild.name)
              .replace("{count}", memberCount.toString())
          : `Hey ${member}! Welcome to **${member.guild.name}**!\n\n` +
              `We're glad to have you here. Make sure to read the rules and have fun!\n\n` +
              `You are member **#${memberCount}**!`,
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "Username", value: member.user.tag, inline: true },
        { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "User ID", value: member.id, inline: true },
      )
      .setFooter({ text: `Member #${memberCount}` })
      .setTimestamp()

    // Send welcome message
    await channel.send({
      content: `${member}`, // Mention the user
      embeds: [welcomeEmbed],
    })

    log.success(`Welcome message sent for ${member.user.tag} in ${member.guild.name}`)
  } catch (error) {
    if (error.code === 50013) {
      log.error(
        `Missing Permissions: Bot cannot send messages in welcome channel. Please ensure bot has "Send Messages" and "Embed Links" permissions.`,
      )
    } else {
      log.error("Error handling member join", error)
    }
  }
}

/**
 * Handle Member Leave
 * Sends a goodbye message when a member leaves the server
 *
 * @param {GuildMember} member - The member who left
 */
export async function handleMemberLeave(member) {
  try {
    const leaveConfig = getLeaveConfig(member.guild.id)

    if (!leaveConfig || !leaveConfig.channelId) {
      log.info(`No leave channel configured for guild: ${member.guild.name}`)
      return
    }

    setTemporaryStatus(`Goodbye ${member.user.username}`, ActivityType.Watching, 5000)

    // Fetch the leave channel
    const channel = await member.guild.channels.fetch(leaveConfig.channelId).catch(() => null)

    if (!channel) {
      log.error("Leave channel not found or bot lacks access")
      return
    }

    const botPermissions = channel.permissionsFor(member.guild.members.me)
    if (!botPermissions || !botPermissions.has("SendMessages") || !botPermissions.has("EmbedLinks")) {
      log.error(
        `Missing permissions in #${channel.name}. Bot needs: Send Messages, Embed Links, View Channel permissions`,
      )
      return
    }

    // Get member count
    const memberCount = member.guild.memberCount

    // Calculate how long the member was in the server
    const joinedTimestamp = member.joinedTimestamp
    const timeInServer = joinedTimestamp ? `<t:${Math.floor(joinedTimestamp / 1000)}:R>` : "Unknown"

    // Create leave embed with custom message if provided
    const leaveEmbed = new EmbedBuilder()
      .setColor(leaveConfig.embedColor || "#ED4245") // Use saved color or default red
      .setTitle("Member Left")
      .setDescription(
        leaveConfig.message
          ? leaveConfig.message.replace("{user}", member.user.tag).replace("{server}", member.guild.name)
          : `**${member.user.tag}** has left the server.\n\n` + `We hope to see you again!`,
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "Username", value: member.user.tag, inline: true },
        { name: "Joined Server", value: timeInServer, inline: true },
        { name: "Members Now", value: `${memberCount}`, inline: true },
      )
      .setFooter({ text: `User ID: ${member.id}` })
      .setTimestamp()

    // Send leave message
    await channel.send({ embeds: [leaveEmbed] })

    log.success(`Leave message sent for ${member.user.tag} in ${member.guild.name}`)
  } catch (error) {
    if (error.code === 50013) {
      log.error(
        `Missing Permissions: Bot cannot send messages in leave channel. Please ensure bot has "Send Messages" and "Embed Links" permissions.`,
      )
    } else {
      log.error("Error handling member leave", error)
    }
  }
}

/**
 * Setup member event listeners
 * @param {Client} client - Discord client instance
 */
export function setupMemberEvents(client) {
  // Handle member join - fires every time a member joins/rejoins
  client.on("guildMemberAdd", async (member) => {
    await handleMemberJoin(member)
  })

  // Handle member leave - fires every time a member leaves
  client.on("guildMemberRemove", async (member) => {
    await handleMemberLeave(member)
  })

  log.success("Member event handler initialized")
}
