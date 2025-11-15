/**
 * Ticket System Handler - Manages support ticket lifecycle
 * Handles ticket creation, claiming, closing, and transcript generation
 * Each ticket gets a private channel with staff access
 */

import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js"
import {
  getTicketConfig,
  createTicket,
  getTicket,
  updateTicket,
  closeTicket as closeTicketStorage,
  getActiveTickets,
} from "../data/storage.js"
import { setTemporaryStatus } from "../utils/activityManager.js"
import { ActivityType } from "discord.js"
import log from "../utils/colors.js"

/**
 * Initialize ticket system for a guild
 * Sets up ticket creation panel with button
 * @param {Guild} guild - Discord guild object
 * @param {string} channelId - Channel ID where ticket panel should be posted
 * @param {string} categoryId - Category ID where ticket channels will be created
 * @param {Array<string>} staffRoleIds - Array of staff role IDs who can manage tickets
 * @param {string} embedColor - Hex color for embed (e.g., #5865F2)
 * @returns {Promise<Message>} The ticket panel message
 */
export async function setupTicketPanel(guild, channelId, categoryId, staffRoleIds, embedColor) {
  try {
    const channel = await guild.channels.fetch(channelId)
    const category = await guild.channels.fetch(categoryId)
    
    const staffRoles = []
    for (const roleId of staffRoleIds) {
      const role = await guild.roles.fetch(roleId)
      if (role) staffRoles.push(role)
    }

    if (!channel || !category || staffRoles.length === 0) {
      throw new Error("Invalid channel, category, or staff roles provided")
    }

    // Create ticket panel embed
    const embed = new EmbedBuilder()
      .setTitle("🎫 Support Ticket System")
      .setDescription(
        "Need help? Click the button below to create a support ticket.\n\n" +
          "**What happens when you create a ticket:**\n" +
          "• A private channel will be created just for you\n" +
          "• Staff members will be notified\n" +
          "• You can discuss your issue privately\n" +
          "• Ticket transcripts are saved when closed\n\n" +
          "**Please note:**\n" +
          "• Only create tickets for genuine support needs\n" +
          "• Be patient - staff will respond as soon as possible\n" +
          "• Abuse of the ticket system may result in warnings",
      )
      .setColor(embedColor)
      .setFooter({ text: "Click the button below to create a ticket" })
      .setTimestamp()

    // Create ticket button
    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("Create Ticket")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder().addComponents(button)

    // Send ticket panel
    const message = await channel.send({
      embeds: [embed],
      components: [row],
    })

    log.success(`Ticket panel created in channel: ${channel.name}`)
    log.info(`Tickets will be created in category: ${category.name}`)
    log.info(`Staff roles: ${staffRoles.map(r => r.name).join(', ')}`)

    return message
  } catch (error) {
    log.error("Error setting up ticket panel", error)
    throw error
  }
}

/**
 * Handle ticket creation when user clicks button
 * Creates private channel and notifies staff
 * @param {ButtonInteraction} interaction - Button interaction from Discord
 */
export async function handleTicketCreate(interaction) {
  try {
    console.log("[v0] Ticket creation started for user:", interaction.user.tag)

    // Show temporary status
    setTemporaryStatus(`Creating Ticket: ${interaction.user.username}`, ActivityType.Playing, 6000)

    // Defer reply to prevent timeout
    await interaction.deferReply({ flags: 64 }) // Ephemeral

    const guildId = interaction.guild.id
    const userId = interaction.user.id

    console.log("[v0] Guild ID:", guildId, "User ID:", userId)

    // Get ticket configuration
    const config = getTicketConfig(guildId)
    console.log("[v0] Ticket config retrieved:", config ? "exists" : "null")

    if (!config) {
      return interaction.editReply({
        content: "❌ Ticket system is not configured for this server. Please ask an administrator to run `/setup-ticket` first.",
      })
    }

    if (!config.enabled) {
      return interaction.editReply({
        content: "❌ Ticket system is currently disabled. Please contact an administrator.",
      })
    }

    const category = await interaction.guild.channels.fetch(config.categoryId).catch(() => null)
    
    if (!category) {
      return interaction.editReply({
        content: "❌ Ticket category no longer exists. Please ask an administrator to run `/setup-ticket` again.",
      })
    }

    const botMember = interaction.guild.members.me
    const categoryPermissions = category.permissionsFor(botMember)
    
    // Check if bot can even access the category
    if (!categoryPermissions) {
      console.log("[v0] Bot cannot access category permissions")
      return interaction.editReply({
        content: 
          `**Cannot Access Category**\n\n` +
          `I cannot access the **${category.name}** category.\n\n` +
          `**How to fix:**\n` +
          `1. Right-click the **"${category.name}"** category\n` +
          `2. Click "Edit Category" → "Permissions" tab\n` +
          `3. Click "+" and add **${botMember.user.username}**\n` +
          `4. Enable "View Channel"\n` +
          `5. Click "Save Changes"`,
      })
    }

    // Check individual permissions
    const permissionChecks = [
      { name: "View Channel", flag: PermissionFlagsBits.ViewChannel },
      { name: "Manage Channels", flag: PermissionFlagsBits.ManageChannels },
      { name: "Send Messages", flag: PermissionFlagsBits.SendMessages },
      { name: "Embed Links", flag: PermissionFlagsBits.EmbedLinks },
      { name: "Attach Files", flag: PermissionFlagsBits.AttachFiles },
      { name: "Manage Roles", flag: PermissionFlagsBits.ManageRoles },
    ]

    const missingPerms = []
    for (const check of permissionChecks) {
      if (!categoryPermissions.has(check.flag)) {
        missingPerms.push(check.name)
        console.log(`[v0] Missing permission: ${check.name}`)
      }
    }

    if (missingPerms.length > 0) {
      console.log("[v0] Bot missing permissions:", missingPerms.join(", "))
      
      return interaction.editReply({
        content: 
          `**Bot Missing Permissions**\n\n` +
          `I need these permissions in the **${category.name}** category:\n` +
          missingPerms.map(p => `• ${p}`).join('\n') + '\n\n' +
          `**How to fix this:**\n` +
          `1. Right-click **"${category.name}"** category\n` +
          `2. Click "Edit Category" → "Permissions"\n` +
          `3. Find **${botMember.user.username}** or click "+" to add it\n` +
          `4. Enable ALL these permissions:\n` +
          `   ✅ View Channel\n` +
          `   ✅ Manage Channels (CRITICAL)\n` +
          `   ✅ Manage Roles (CRITICAL)\n` +
          `   ✅ Send Messages\n` +
          `   ✅ Embed Links\n` +
          `   ✅ Attach Files\n` +
          `5. Click "Save Changes"\n\n` +
          `**Still not working?**\n` +
          `Make sure my role is positioned ABOVE all staff roles in Server Settings → Roles`,
      })
    }

    const staffRoleIds = Array.isArray(config.staffRoleIds) ? config.staffRoleIds : [config.staffRoleId]
    const botRole = botMember.roles.highest
    
    for (const staffRoleId of staffRoleIds) {
      const staffRole = await interaction.guild.roles.fetch(staffRoleId)
      if (staffRole && botRole.position <= staffRole.position) {
        return interaction.editReply({
          content:
            `❌ **Role Hierarchy Issue**\n\n` +
            `My role must be ABOVE the staff role!\n\n` +
            `**Current positions:**\n` +
            `• My role (${botRole.name}): Position ${botRole.position}\n` +
            `• Staff role (${staffRole.name}): Position ${staffRole.position}\n\n` +
            `**How to fix:**\n` +
            `1. Go to Server Settings → Roles\n` +
            `2. Drag **${botRole.name}** ABOVE **${staffRole.name}**\n` +
            `3. Save changes\n` +
            `4. Try creating a ticket again`,
        })
      }
    }

    console.log("[v0] All permission checks passed")

    // Check if user already has an active ticket
    const activeTickets = getActiveTickets(guildId, userId)
    console.log("[v0] Active tickets for user:", activeTickets.length)

    if (activeTickets.length > 0) {
      const ticketChannel = await interaction.guild.channels.fetch(activeTickets[0].channelId).catch(() => null)
      if (ticketChannel) {
        return interaction.editReply({
          content: `❌ You already have an active ticket: ${ticketChannel}\n\nPlease close it before creating a new one.`,
        })
      }
    }

    // Generate unique ticket number
    const ticketNumber = Math.floor(Math.random() * 9000) + 1000
    const ticketId = `ticket-${userId}-${Date.now()}`

    console.log("[v0] Creating ticket channel with number:", ticketNumber)

    let ticketChannel
    try {
      const permissionOverwrites = [
        {
          // Hide from @everyone
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          // Allow ticket creator to view and send messages
          id: userId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
        {
          // Bot permissions
          id: interaction.guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
          ],
        },
      ]
      
      // Add permissions for each staff role
      for (const staffRoleId of staffRoleIds) {
        permissionOverwrites.push({
          id: staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        })
      }
      
      ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: config.categoryId,
        topic: `Support ticket for ${interaction.user.tag} | Ticket ID: ${ticketId}`,
        permissionOverwrites,
      })

      console.log("[v0] Ticket channel created:", ticketChannel.id)
    } catch (channelError) {
      console.log("[v0] Error creating ticket channel:", channelError.message)
      log.error("Failed to create ticket channel", channelError)
      return interaction.editReply({
        content:
          "Failed to create ticket channel. Please ensure the bot has proper permissions in the ticket category.",
      })
    }

    // Create ticket data
    const ticketData = {
      id: ticketId,
      ticketNumber: ticketNumber,
      guildId: guildId,
      channelId: ticketChannel.id,
      userId: userId,
      claimedBy: null,
      status: "open",
      createdAt: Date.now(),
      closedAt: null,
      messages: [],
    }

    // Save ticket to storage
    createTicket(guildId, ticketData)
    console.log("[v0] Ticket data saved to storage")

    // Create ticket welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${ticketNumber}`)
      .setDescription(
        `Welcome ${interaction.user}!\n\n` +
          "Thank you for creating a support ticket. A staff member will assist you shortly.\n\n" +
          "**While you wait:**\n" +
          "• Please describe your issue in detail\n" +
          "• Include any relevant screenshots or information\n" +
          "• Be patient - staff will respond as soon as possible\n\n" +
          `**Ticket Information:**\n` +
          `• Ticket ID: \`${ticketId}\`\n` +
          `• Created by: ${interaction.user.tag}\n` +
          `• Status: Open`,
      )
      .setColor(config.embedColor)
      .setTimestamp()

    // Create ticket control buttons
    const claimButton = new ButtonBuilder()
      .setCustomId(`ticket_claim_${ticketId}`)
      .setLabel("Claim Ticket")
      .setEmoji("✋")
      .setStyle(ButtonStyle.Success)

    const closeButton = new ButtonBuilder()
      .setCustomId(`ticket_close_${ticketId}`)
      .setLabel("Close Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)

    const row = new ActionRowBuilder().addComponents(claimButton, closeButton)

    const staffMentions = staffRoleIds.map(id => `<@&${id}>`).join(' ')
    
    // Send welcome message
    await ticketChannel.send({
      content: `${interaction.user} ${staffMentions}`,
      embeds: [welcomeEmbed],
      components: [row],
    })

    console.log("[v0] Welcome message sent to ticket channel")

    // Reply to user
    await interaction.editReply({
      content: `✅ Ticket created! Please check ${ticketChannel} to discuss your issue.`,
    })

    log.event(`Ticket #${ticketNumber} created by ${interaction.user.tag} in ${interaction.guild.name}`)

    console.log("[v0] Ticket creation completed successfully")
  } catch (error) {
    console.log("[v0] Error in handleTicketCreate:", error)
    log.error("Error creating ticket", error)

    const errorResponse = {
      content:
        "An error occurred while creating your ticket. Please contact an administrator.\n" +
        `Error: ${error.message}`,
    }

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorResponse)
      } else {
        await interaction.reply({ ...errorResponse, flags: 64 })
      }
    } catch (replyError) {
      log.error("Failed to send error message", replyError)
    }
  }
}

/**
 * Handle ticket claim by staff member
 * Updates ticket status and notifies user
 * @param {ButtonInteraction} interaction - Button interaction from Discord
 */
export async function handleTicketClaim(interaction) {
  try {
    // Show temporary status
    setTemporaryStatus(`Claiming Ticket: ${interaction.user.username}`, ActivityType.Playing, 5000)

    // Extract ticket ID from button custom ID
    const ticketId = interaction.customId.replace("ticket_claim_", "")
    const guildId = interaction.guild.id

    // Get ticket data
    const ticket = getTicket(guildId, ticketId)
    if (!ticket) {
      return interaction.reply({
        content: "This ticket no longer exists.",
        flags: 64,
      })
    }

    // Check if ticket is already claimed
    if (ticket.claimedBy) {
      const claimedUser = await interaction.guild.members.fetch(ticket.claimedBy)
      return interaction.reply({
        content: `This ticket is already claimed by ${claimedUser.user.tag}.`,
        flags: 64,
      })
    }

    const config = getTicketConfig(guildId)
    const staffRoleIds = Array.isArray(config.staffRoleIds) ? config.staffRoleIds : [config.staffRoleId]
    const member = interaction.member
    
    const hasStaffRole = member.roles.cache.some(role => staffRoleIds.includes(role.id))
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator)
    
    if (!hasStaffRole && !isAdmin) {
      return interaction.reply({
        content: "❌ Only staff members or administrators can claim tickets.",
        flags: 64,
      })
    }

    // Update ticket with claimer
    updateTicket(guildId, ticketId, {
      claimedBy: interaction.user.id,
      status: "claimed",
    })

    // Update embed to show claimed status
    const claimEmbed = new EmbedBuilder()
      .setTitle("✋ Ticket Claimed")
      .setDescription(`${interaction.user} has claimed this ticket and will assist you.`)
      .setColor("#57F287") // Green
      .setTimestamp()

    await interaction.reply({
      embeds: [claimEmbed],
    })

    log.event(`Ticket ${ticket.ticketNumber} claimed by ${interaction.user.tag}`)
  } catch (error) {
    log.error("Error claiming ticket", error)
    await interaction.reply({
      content: "An error occurred while claiming this ticket.",
      flags: 64,
    })
  }
}

/**
 * Handle ticket close
 * Generates transcript and deletes channel
 * @param {ButtonInteraction} interaction - Button interaction from Discord
 */
export async function handleTicketClose(interaction) {
  try {
    // Show temporary status
    setTemporaryStatus(`Closing Ticket`, ActivityType.Playing, 8000)

    // Defer reply
    await interaction.deferReply()

    // Extract ticket ID from button custom ID
    const ticketId = interaction.customId.replace("ticket_close_", "")
    const guildId = interaction.guild.id

    // Get ticket data
    const ticket = getTicket(guildId, ticketId)
    if (!ticket) {
      return interaction.editReply({
        content: "This ticket no longer exists.",
      })
    }

    const config = getTicketConfig(guildId)
    const staffRoleIds = Array.isArray(config.staffRoleIds) ? config.staffRoleIds : [config.staffRoleId]
    const member = interaction.member
    
    const hasStaffRole = member.roles.cache.some(role => staffRoleIds.includes(role.id))
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator)
    const isTicketCreator = interaction.user.id === ticket.userId
    
    if (!hasStaffRole && !isAdmin && !isTicketCreator) {
      return interaction.editReply({
        content: "❌ Only staff members, administrators, or the ticket creator can close this ticket.",
      })
    }

    // Generate transcript
    const transcript = await generateTranscript(interaction.channel, ticket)

    // Send transcript to logging channel if configured
    if (config.transcriptChannelId) {
      try {
        const transcriptChannel = await interaction.guild.channels.fetch(config.transcriptChannelId)
        await transcriptChannel.send({
          embeds: [transcript],
        })
        log.success(`Ticket transcript saved to ${transcriptChannel.name}`)
      } catch (error) {
        log.error("Error sending transcript", error)
      }
    }

    // Close ticket in storage
    closeTicketStorage(guildId, ticketId)

    // Send closing message
    const closeEmbed = new EmbedBuilder()
      .setTitle("🔒 Ticket Closing")
      .setDescription(
        "This ticket is being closed. The channel will be deleted in 5 seconds.\n\n" +
          "Thank you for using our support system!",
      )
      .setColor("#ED4245") // Red
      .setTimestamp()

    await interaction.editReply({
      embeds: [closeEmbed],
    })

    log.event(`Ticket ${ticket.ticketNumber} closed by ${interaction.user.tag}`)

    // Delete channel after 5 seconds
    setTimeout(async () => {
      try {
        await interaction.channel.delete()
      } catch (error) {
        log.error("Error deleting ticket channel", error)
      }
    }, 5000)
  } catch (error) {
    log.error("Error closing ticket", error)
    await interaction.editReply({
      content: "An error occurred while closing this ticket.",
    })
  }
}

/**
 * Generate ticket transcript from channel messages
 * @param {TextChannel} channel - Ticket channel
 * @param {Object} ticket - Ticket data
 * @returns {Promise<EmbedBuilder>} Transcript embed
 */
async function generateTranscript(channel, ticket) {
  try {
    // Fetch last 100 messages from channel
    const messages = await channel.messages.fetch({ limit: 100 })
    const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp)

    // Build transcript text
    let transcriptText = ""
    sortedMessages.forEach((msg) => {
      if (!msg.author.bot || msg.embeds.length === 0) {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString()
        transcriptText += `[${timestamp}] ${msg.author.tag}: ${msg.content}\n`
      }
    })

    // Truncate if too long (Discord embed field limit is 1024)
    if (transcriptText.length > 4000) {
      transcriptText = transcriptText.substring(0, 4000) + "\n... (truncated)"
    }

    // Create transcript embed
    const embed = new EmbedBuilder()
      .setTitle(`📝 Ticket Transcript #${ticket.ticketNumber}`)
      .setDescription(
        `**Ticket Information:**\n` +
          `• Ticket ID: \`${ticket.id}\`\n` +
          `• Created by: <@${ticket.userId}>\n` +
          `• Claimed by: ${ticket.claimedBy ? `<@${ticket.claimedBy}>` : "Unclaimed"}\n` +
          `• Created: <t:${Math.floor(ticket.createdAt / 1000)}:F>\n` +
          `• Closed: <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
          `**Messages:**\n\`\`\`\n${transcriptText || "No messages in this ticket."}\n\`\`\``,
      )
      .setColor("#5865F2")
      .setTimestamp()

    return embed
  } catch (error) {
    log.error("Error generating transcript", error)
    throw error
  }
}

/**
 * Get ticket statistics for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Object} Ticket statistics
 */
export function getTicketStats(guildId) {
  const config = getTicketConfig(guildId)
  if (!config) return null

  const activeTickets = getActiveTickets(guildId)

  return {
    totalTickets: config.ticketCount || 0,
    activeTickets: activeTickets.length,
    closedTickets: (config.ticketCount || 0) - activeTickets.length,
  }
}
