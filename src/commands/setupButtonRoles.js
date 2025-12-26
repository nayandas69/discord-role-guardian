/**
 * Setup Button Roles Command
 * Allows server owners to create button role messages
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { saveButtonRoleConfig } from '../data/storage.js';
import { log } from '../utils/colors.js';

export const setupButtonRolesCommand = {
  data: new SlashCommandBuilder()
    .setName('setup-button-roles')
    .setDescription('Create a button role message')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel to send the button role message')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('title').setDescription('Title of the button role embed').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('Description for the button role message')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('roles')
        .setDescription(
          'Format: label:roleID:style,label:roleID:style (style: primary/secondary/success/danger)'
        )
        .setRequired(true)
    ),

  /**
   * Execute the setup-button-roles command
   * @param {ChatInputCommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const rolesInput = interaction.options.getString('roles');

    log.info(`Processing button roles setup in #${channel.name}`);

    // Parse role configuration from user input
    const roleConfig = parseRoleConfig(rolesInput);

    if (!roleConfig || roleConfig.length === 0) {
      log.warn('Invalid role format provided by user');
      return interaction.editReply({
        content:
          'Invalid role format! Use: label:roleID:style,label:roleID:style\nExample: Gamer:123456789:primary,Artist:987654321:success\nStyles: primary (blue), secondary (gray), success (green), danger (red)',
        ephemeral: true
      });
    }

    // Discord has a max of 5 buttons per row
    if (roleConfig.length > 25) {
      return interaction.editReply({
        content: 'Maximum 25 button roles allowed (5 rows of 5 buttons)!',
        ephemeral: true
      });
    }

    // Validate that roles exist in the server
    const invalidRoles = [];
    for (const config of roleConfig) {
      const role = interaction.guild.roles.cache.get(config.roleId);
      if (!role) {
        invalidRoles.push(config.roleId);
      }
    }

    if (invalidRoles.length > 0) {
      log.error(`Invalid role IDs detected: ${invalidRoles.join(', ')}`);
      return interaction.editReply({
        content: `Invalid role IDs: ${invalidRoles.join(', ')}\nMake sure all role IDs are correct!`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(title)
      .setDescription(description);

    // Create button rows (max 5 buttons per row)
    const rows = [];
    for (let i = 0; i < roleConfig.length; i += 5) {
      const rowButtons = roleConfig.slice(i, i + 5);
      const row = new ActionRowBuilder();

      for (const config of rowButtons) {
        const button = new ButtonBuilder()
          .setCustomId(`button_role_${config.roleId}`)
          .setLabel(config.label)
          .setStyle(getButtonStyle(config.style));

        row.addComponents(button);
      }

      rows.push(row);
    }

    try {
      // Send button role message to specified channel
      const message = await channel.send({
        embeds: [embed],
        components: rows
      });

      const enhancedRoleConfig = roleConfig.map((config) => ({
        ...config,
        guildId: interaction.guild.id,
        channelId: channel.id
      }));

      // Save configuration to storage for button handler
      saveButtonRoleConfig(message.id, enhancedRoleConfig);

      // Confirm success to admin
      await interaction.editReply({
        content: `Button role message created in ${channel}!\nMessage ID: ${message.id}`,
        ephemeral: true
      });

      log.success(`Button roles setup in #${channel.name} by ${interaction.user.tag}`);
      log.info(`Message ID: ${message.id}, Roles: ${roleConfig.length}`);
    } catch (error) {
      log.error('Failed to create button role message');
      log.error(`Error: ${error.message}`);
      await interaction.editReply({
        content: 'Failed to create button role message. Check bot permissions!',
        ephemeral: true
      });
    }
  }
};

/**
 * Parse role configuration from user input string
 * @param {string} input - Format: label:roleID:style,label:roleID:style
 * @returns {Array<{label: string, roleId: string, style: string}>} Parsed configuration
 */
function parseRoleConfig(input) {
  try {
    const pairs = input.split(',').map((pair) => pair.trim());
    return pairs.map((pair) => {
      const parts = pair.split(':').map((part) => part.trim());
      const label = parts[0];
      const roleId = parts[1];
      const style = parts[2] || 'primary'; // Default to primary if not specified
      return { label, roleId, style };
    });
  } catch (error) {
    log.error('Error parsing role configuration');
    log.error(`Details: ${error.message}`);
    return null;
  }
}

/**
 * Convert style string to Discord ButtonStyle
 * @param {string} style - Style name (primary, secondary, success, danger)
 * @returns {ButtonStyle} Discord button style
 */
function getButtonStyle(style) {
  const styles = {
    primary: ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success: ButtonStyle.Success,
    danger: ButtonStyle.Danger
  };
  return styles[style?.toLowerCase()] || ButtonStyle.Primary;
}
