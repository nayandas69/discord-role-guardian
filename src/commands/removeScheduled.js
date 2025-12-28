/**
 * Remove Scheduled Message Command - Delete scheduled messages
 * Allows admins to remove scheduled announcements
 * Author: nayandas69
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { removeScheduledMessage, getScheduledMessages } from '../data/storage.js';
import { cancelScheduledMessage } from '../handlers/scheduledMessages.js';
import log from '../utils/colors.js';

export const removeScheduledCommand = {
  data: new SlashCommandBuilder()
    .setName('remove-scheduled')
    .setDescription('Remove a scheduled message')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Name of the scheduled message to remove')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false), // Added to ensure command only works in servers

  // Autocomplete handler to show available scheduled messages
  async autocomplete(interaction) {
    try {
      const allScheduled = getScheduledMessages();
      const guildMessages = allScheduled.get(interaction.guildId) || [];

      // Create choices from scheduled message names
      const choices = guildMessages.map((msg) => ({
        name: `${msg.name} (${msg.schedule.type})`,
        value: msg.name
      }));

      await interaction.respond(choices.slice(0, 25)); // Discord limits to 25 choices
    } catch (error) {
      log.error('Error in remove-scheduled autocomplete', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    try {
      const messageName = interaction.options.getString('name');

      // Get all scheduled messages for this guild
      const allScheduled = getScheduledMessages();
      const guildMessages = allScheduled.get(interaction.guildId) || [];

      // Find the message to remove
      const messageToRemove = guildMessages.find((msg) => msg.name === messageName);

      if (!messageToRemove) {
        return interaction.editReply({
          content: `No scheduled message found with name "${messageName}". Use /list-scheduled to see all scheduled messages.`
        });
      }

      const timerCancelled = cancelScheduledMessage(messageToRemove.id);

      // Remove the scheduled message from storage
      removeScheduledMessage(interaction.guildId, messageToRemove.id);

      // Create confirmation embed
      const embed = {
        color: 0xff6b6b, // Red color for deletion
        title: 'Scheduled Message Removed',
        description: `Successfully removed scheduled message: **${messageName}**`,
        fields: [
          {
            name: 'Type',
            value: messageToRemove.schedule.type,
            inline: true
          },
          {
            name: 'Channel',
            value: `<#${messageToRemove.channelId}>`,
            inline: true
          },
          {
            name: 'Status',
            value: timerCancelled ? '✅ Timer cleared immediately' : '⚠️ No active timer found',
            inline: false
          }
        ],
        footer: {
          text: timerCancelled
            ? 'Stopped immediately - no restart needed'
            : 'This message will no longer be sent'
        },
        timestamp: new Date().toISOString()
      };

      await interaction.editReply({ embeds: [embed] });

      log.success(
        `Removed scheduled message "${messageName}" in ${interaction.guild.name} by ${interaction.user.tag}`
      );

      if (timerCancelled) {
        log.success('Active timer cleared successfully - no restart required');
      } else {
        log.info('No active timer found for this scheduled message');
      }
    } catch (error) {
      log.error('Error in remove-scheduled command', error);
      throw error;
    }
  }
};
