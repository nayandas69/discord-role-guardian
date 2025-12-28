/**
 * Setup Leveling Command - Configure XP and leveling system
 * Allows admins to enable leveling and configure XP rewards
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { saveLevelingConfig } from '../data/storage.js';
import log from '../utils/colors.js';

export const setupLevelingCommand = {
  data: new SlashCommandBuilder()
    .setName('setup-leveling')
    .setDescription('Configure the leveling system for your server')
    .addBooleanOption((option) =>
      option
        .setName('enabled')
        .setDescription('Enable or disable leveling system')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('announce-channel')
        .setDescription('Channel for level-up and XP announcements')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('xp-min')
        .setDescription('Minimum XP per message (default: 15)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('xp-max')
        .setDescription('Maximum XP per message (default: 25)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('cooldown')
        .setDescription('Cooldown between XP gains in seconds (default: 60)')
        .setMinValue(10)
        .setMaxValue(300)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('announce-level')
        .setDescription('Announce when users level up (default: true)')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('announce-xp')
        .setDescription('Announce when users earn XP - instant notifications (default: false)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    try {
      const enabled = interaction.options.getBoolean('enabled');
      const announceChannel = interaction.options.getChannel('announce-channel');
      const xpMin = interaction.options.getInteger('xp-min') || 15;
      const xpMax = interaction.options.getInteger('xp-max') || 25;
      const cooldown = interaction.options.getInteger('cooldown') || 60;
      const announceLevel = interaction.options.getBoolean('announce-level') ?? true;
      const announceXP = interaction.options.getBoolean('announce-xp') ?? false;

      if (xpMin > xpMax) {
        return interaction.editReply({
          content: 'Minimum XP cannot be greater than maximum XP!'
        });
      }

      const config = {
        enabled,
        announceChannel: announceChannel?.id || null,
        xpMin,
        xpMax,
        cooldown: cooldown * 1000,
        announceLevel,
        announceXP,
        levelRoles: []
      };

      saveLevelingConfig(interaction.guildId, config);

      const embed = {
        color: enabled ? 0x00ff00 : 0xff0000,
        title: enabled ? 'Leveling System Enabled' : 'Leveling System Disabled',
        description: enabled
          ? 'Members will now earn XP for chatting and level up automatically!'
          : 'Leveling system has been disabled for this server.',
        fields: [],
        timestamp: new Date().toISOString()
      };

      if (enabled) {
        embed.fields.push(
          {
            name: 'XP Range',
            value: `${xpMin} - ${xpMax} XP per message`,
            inline: true
          },
          {
            name: 'Cooldown',
            value: `${cooldown} seconds`,
            inline: true
          },
          {
            name: 'Announcements',
            value: announceChannel
              ? `Level-ups: ${announceLevel ? 'Enabled' : 'Disabled'}\nXP Gains: ${announceXP ? 'Enabled' : 'Disabled'}\nChannel: ${announceChannel}`
              : 'Level-ups: ' + (announceLevel ? 'Enabled in message channel' : 'Disabled'),
            inline: false
          }
        );
      }

      embed.fields.push({
        name: 'Next Steps',
        value: 'Use `/add-level-role` to configure roles that are awarded at specific levels!',
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });
      log.success(
        `Leveling system ${enabled ? 'enabled' : 'disabled'} in ${interaction.guild.name}`
      );
    } catch (error) {
      log.error('Error in setup-leveling command', error);
      throw error;
    }
  }
};
