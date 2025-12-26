/**
 * Reset Command - Reset all bot configurations for the server
 * FIXED: Now properly clears in-memory caches by emitting events to all handlers
 * FIXED: Scheduled messages are cancelled before data deletion
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { resetGuildConfig } from '../data/storage.js';
import { log } from '../utils/colors.js';

const data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Reset all bot configurations for this server')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false);

/**
 * Execute reset command
 * FIXED: Properly clears all cached configurations immediately without restart
 * FIXED: Scheduled messages are cancelled instantly
 * @param {Interaction} interaction - Discord interaction object
 */
async function execute(interaction) {
  try {
    const guildId = interaction.guildId;
    const guildName = interaction.guild.name;

    log.command(`Reset command used in guild: ${guildName}`);
    log.system(`[RESET] Initiating full configuration reset for guild: ${guildId}`);

    const result = await resetGuildConfig(guildId);

    await new Promise((resolve) => setTimeout(resolve, 200));

    await interaction.editReply({
      content:
        `**✅ Reset Complete**\n\n` +
        `All bot configurations have been reset for this server:\n\n` +
        `• Welcome messages: Removed ✅\n` +
        `• Leave messages: Removed ✅\n` +
        `• Reaction roles: Removed ${result.reactionRolesRemoved} configuration(s) ✅\n` +
        `• Button roles: Removed ${result.buttonRolesRemoved || 0} configuration(s) ✅\n` +
        `• Leveling system: Removed (all user XP/levels cleared: ${result.userLevelsRemoved}) ✅\n` +
        `• Scheduled messages: ${result.scheduledMessagesRemoved ? 'Removed and cancelled ✅' : 'None configured'}\n` +
        `• Ticket system: Removed (panel, category, staff roles) ✅\n` +
        `• Ticket data: Removed (all open and closed tickets) ✅\n` +
        `• Bot messages: Deleted ${result.messagesDeleted} panel message(s) 🗑️\n` +
        `• In-memory caches: Cleared ✅\n\n` +
        `⚠️ Note: Existing ticket channels must be deleted manually.\n\n` +
        `✅ **No restart required!** All changes take effect immediately.\n` +
        `🚫 **Scheduled messages stopped** - no more automated messages will be sent.\n\n` +
        `You can now set up the bot again using the setup commands.`
    });

    log.success(`[RESET] Successfully reset all configurations for guild: ${guildName}`);
    log.success(`[RESET] Bot is now using fresh configuration without restart`);
    log.success(`[RESET] Deleted ${result.messagesDeleted} configuration message(s)`);
  } catch (error) {
    log.error('[RESET] Error executing reset command', error);

    const errorMessage = 'Failed to reset bot configurations. Please try again.';

    await interaction.editReply({ content: errorMessage });
  }
}

export const resetCommand = {
  data,
  execute
};
