/**
 * List Scheduled Messages Command - View all scheduled messages
 * UPDATED: Now displays timezone information and new schedule types
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildScheduledMessages } from '../data/storage.js';
import log from '../utils/colors.js';

export const listScheduledCommand = {
  data: new SlashCommandBuilder()
    .setName('list-scheduled')
    .setDescription('View all scheduled messages for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false), // Added to ensure command only works in servers

  async execute(interaction) {
    try {
      const messages = getGuildScheduledMessages(interaction.guildId);

      if (messages.length === 0) {
        return interaction.editReply({
          content: 'No scheduled messages configured! Use `/schedule-message` to create one.'
        });
      }

      const description = messages
        .map((msg, index) => {
          // Get timezone string
          const timezoneStr =
            msg.schedule.timezoneOffset === 0
              ? 'UTC'
              : `UTC${msg.schedule.timezoneOffset > 0 ? '+' : ''}${msg.schedule.timezoneOffset}`;

          // Build schedule description based on type
          let scheduleDesc = '';
          switch (msg.schedule.type) {
            case 'once':
              scheduleDesc = `Once at ${msg.schedule.time} ${timezoneStr}`;
              break;
            case 'daily':
              scheduleDesc = `Daily at ${msg.schedule.time} ${timezoneStr}`;
              break;
            case 'weekly':
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              scheduleDesc = `Weekly on ${dayNames[msg.schedule.dayOfWeek]} at ${msg.schedule.time} ${timezoneStr}`;
              break;
            case 'monthly':
              scheduleDesc = `Monthly on day ${msg.schedule.dayOfMonth} at ${msg.schedule.time} ${timezoneStr}`;
              break;
            default:
              scheduleDesc = 'Unknown schedule type';
          }

          const status = msg.enabled ? '✅ Active' : '❌ Disabled';

          return `**${index + 1}. ${msg.name}** ${status}\nChannel: <#${msg.channelId}>\nSchedule: ${scheduleDesc}\nMessage: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`;
        })
        .join('\n\n');

      const embed = {
        color: 0x0099ff,
        title: '📅 Scheduled Messages',
        description,
        footer: {
          text: 'Use /remove-scheduled to delete a scheduled message'
        },
        timestamp: new Date().toISOString()
      };

      await interaction.editReply({ embeds: [embed] });
      log.command(`Scheduled messages listed by ${interaction.user.tag}`);
    } catch (error) {
      log.error('Error in list-scheduled command', error);
      throw error;
    }
  }
};
