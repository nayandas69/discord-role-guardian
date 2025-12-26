/**
 * Command Registry - Register slash commands with Discord API
 * Handles automatic command deployment to Discord servers
 */

import { REST, Routes } from 'discord.js';
import { setupReactionRolesCommand } from '../commands/setupReactionRoles.js';
import { setupButtonRolesCommand } from '../commands/setupButtonRoles.js';
import { removeButtonRolesCommand } from '../commands/removeButtonRoles.js';
import { setupWelcomeCommand } from '../commands/setupWelcome.js';
import { setupLeaveCommand } from '../commands/setupLeave.js';
import { removeReactionRolesCommand } from '../commands/removeReactionRoles.js';
import { resetCommand } from '../commands/reset.js';
import { setupLevelingCommand } from '../commands/setupLeveling.js';
import { addLevelRoleCommand } from '../commands/addLevelRole.js';
import { rankCommand } from '../commands/rank.js';
import { leaderboardCommand } from '../commands/leaderboard.js';
import { scheduleMessageCommand } from '../commands/scheduleMessage.js';
import { listScheduledCommand } from '../commands/listScheduled.js';
import { removeScheduledCommand } from '../commands/removeScheduled.js';
import { setupTicketCommand } from '../commands/setupTicket.js';
import { ticketStatsCommand } from '../commands/ticketStats.js';
import log from './colors.js';

/**
 * Register all slash commands with Discord
 * @param {Client} client - Discord client instance
 */
export async function registerCommands(client) {
  const commands = [
    setupReactionRolesCommand,
    setupButtonRolesCommand,
    setupWelcomeCommand,
    setupLeaveCommand,
    removeReactionRolesCommand,
    removeButtonRolesCommand,
    resetCommand,
    setupLevelingCommand,
    addLevelRoleCommand,
    rankCommand,
    leaderboardCommand,
    scheduleMessageCommand,
    listScheduledCommand,
    removeScheduledCommand,
    setupTicketCommand,
    ticketStatsCommand
  ];

  const commandsData = commands.map((cmd) => cmd.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    log.system('Registering slash commands...');

    // GUILD_ID is no longer needed for multi-server bots
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsData });
    log.success(`Registered ${commands.length} commands globally across all servers`);
    log.info('Commands will be available in 5-10 minutes (Discord API propagation)');
  } catch (error) {
    log.error('Error registering commands', error);
    throw error;
  }
}
