/**
 * Remove Reaction Roles Command
 * Delete existing reaction role configuration
 */

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { removeReactionRoleConfig } from '../data/storage.js';
import { log } from '../utils/colors.js';

export const removeReactionRolesCommand = {
  data: new SlashCommandBuilder()
    .setName('remove-reaction-roles')
    .setDescription('Remove a reaction role message')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('message-id')
        .setDescription('ID of the reaction role message to remove')
        .setRequired(true)
    ),

  /**
   * Execute the remove-reaction-roles command
   * @param {ChatInputCommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const messageId = interaction.options.getString('message-id');

    log.info(`Attempting to remove reaction roles for message: ${messageId}`);

    // Remove configuration from storage
    const removed = removeReactionRoleConfig(messageId);

    if (removed) {
      await interaction.editReply({
        content: `Reaction role configuration removed for message ID: ${messageId}`,
        flags: MessageFlags.Ephemeral
      });
      log.success(`Reaction roles removed for message: ${messageId}`);
    } else {
      await interaction.editReply({
        content: `No reaction role configuration found for message ID: ${messageId}`,
        flags: MessageFlags.Ephemeral
      });
      log.warn(`No configuration found for message: ${messageId}`);
    }
  }
};
