/**
 * Remove Button Roles Command
 * Delete existing button role configuration
 */

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { removeButtonRoleConfig } from '../data/storage.js';
import { log } from '../utils/colors.js';

export const removeButtonRolesCommand = {
  data: new SlashCommandBuilder()
    .setName('remove-button-roles')
    .setDescription('Remove a button role message')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('message-id')
        .setDescription('ID of the button role message to remove')
        .setRequired(true)
    ),

  /**
   * Execute the remove-button-roles command
   * @param {ChatInputCommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const messageId = interaction.options.getString('message-id');

    log.info(`Attempting to remove button roles for message: ${messageId}`);

    // Remove configuration from storage
    const removed = removeButtonRoleConfig(messageId);

    if (removed) {
      await interaction.editReply({
        content: `Button role configuration removed for message ID: ${messageId}`,
        flags: MessageFlags.Ephemeral
      });
      log.success(`Button roles removed for message: ${messageId}`);
    } else {
      await interaction.editReply({
        content: `No button role configuration found for message ID: ${messageId}`,
        flags: MessageFlags.Ephemeral
      });
      log.warn(`No configuration found for message: ${messageId}`);
    }
  }
};
