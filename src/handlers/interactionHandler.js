/**
 * Interaction Handler - Process all Discord interactions
 * Handles slash commands, buttons, autocomplete, and shows typing indicator
 */

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
import { setTemporaryStatus } from '../utils/activityManager.js';
import { ActivityType } from 'discord.js';
import log from '../utils/colors.js';
import { setupTicketCommand } from '../commands/setupTicket.js';
import { ticketStatsCommand } from '../commands/ticketStats.js';
import {
  handleTicketCreate,
  handleTicketClaim,
  handleTicketClose
} from '../handlers/ticketSystem.js';
import { handleButtonRole } from '../handlers/buttonRoles.js';

/**
 * Map of command names to their handler functions
 */
const commands = {
  'setup-reaction-roles': setupReactionRolesCommand,
  'setup-button-roles': setupButtonRolesCommand,
  'setup-welcome': setupWelcomeCommand,
  'setup-leave': setupLeaveCommand,
  'remove-reaction-roles': removeReactionRolesCommand,
  'remove-button-roles': removeButtonRolesCommand,
  reset: resetCommand,
  'setup-leveling': setupLevelingCommand,
  'add-level-role': addLevelRoleCommand,
  rank: rankCommand,
  leaderboard: leaderboardCommand,
  'schedule-message': scheduleMessageCommand,
  'list-scheduled': listScheduledCommand,
  'remove-scheduled': removeScheduledCommand,
  'setup-ticket': setupTicketCommand,
  'ticket-stats': ticketStatsCommand
};

/**
 * Map of command names to their display status
 * Shows users what the bot is doing in real-time
 */
const commandStatusText = {
  'setup-reaction-roles': 'Setting up Reaction Roles',
  'setup-button-roles': 'Setting up Button Roles',
  'setup-welcome': 'Configuring Welcome Messages',
  'setup-leave': 'Configuring Leave Messages',
  'remove-reaction-roles': 'Removing Reaction Roles',
  'remove-button-roles': 'Removing Button Roles',
  reset: 'Resetting Configuration',
  'setup-leveling': 'Setting up Leveling System',
  'add-level-role': 'Adding Level Role Reward',
  rank: 'Checking User Rank',
  leaderboard: 'Generating Leaderboard',
  'schedule-message': 'Scheduling Message',
  'list-scheduled': 'Listing Scheduled Messages',
  'remove-scheduled': 'Removing Scheduled Message',
  'setup-ticket': 'Setting up Ticket System',
  'ticket-stats': 'Fetching Ticket Statistics'
};

/**
 * Handle all interaction events (commands, buttons, autocomplete, etc.)
 * @param {Interaction} interaction - Discord interaction object
 */
export async function handleInteractionCreate(interaction) {
  if (interaction.isAutocomplete()) {
    await handleAutocomplete(interaction);
    return;
  }

  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
  }

  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
  }
}

/**
 * Process slash command execution
 * Shows typing indicator while processing
 * @param {ChatInputCommandInteraction} interaction - Command interaction
 */
async function handleSlashCommand(interaction) {
  const command = commands[interaction.commandName];

  if (!command) {
    log.warn(`Unknown command attempted: ${interaction.commandName}`);
    return interaction.reply({
      content: 'Unknown command!',
      flags: 64 // 64 = MessageFlags.Ephemeral
    });
  }

  try {
    const statusText = commandStatusText[interaction.commandName] || 'Processing Command';
    setTemporaryStatus(statusText, ActivityType.Playing, 8000); // Show for 8 seconds

    // Show typing indicator (bot appears to be typing)
    await interaction.deferReply({ flags: 64 });

    // Simulate processing time (realistic bot behavior)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Execute the command
    await command.execute(interaction);

    log.command(`Command executed: /${interaction.commandName} by ${interaction.user.tag}`);
  } catch (error) {
    log.error(`Error executing /${interaction.commandName}`, error);

    // Send error message to user
    const errorMessage = {
      content:
        'An error occurred while executing this command! Please check bot permissions and try again.'
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply({ ...errorMessage, flags: 64 });
    }
  }
}

/**
 * Handle autocomplete interactions
 * @param {AutocompleteInteraction} interaction - Autocomplete interaction
 */
async function handleAutocomplete(interaction) {
  const command = commands[interaction.commandName];

  if (!command || !command.autocomplete) {
    return interaction.respond([]);
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    log.error(`Error in autocomplete for ${interaction.commandName}`, error);
    await interaction.respond([]);
  }
}

/**
 * Handle button click interactions
 * @param {ButtonInteraction} interaction - Button interaction
 */
async function handleButtonInteraction(interaction) {
  log.event(`Button clicked: ${interaction.customId} by ${interaction.user.tag}`);

  if (interaction.customId.startsWith('button_role_')) {
    return handleButtonRole(interaction);
  }

  if (interaction.customId === 'create_ticket') {
    return handleTicketCreate(interaction);
  }

  if (interaction.customId.startsWith('ticket_claim_')) {
    return handleTicketClaim(interaction);
  }

  if (interaction.customId.startsWith('ticket_close_')) {
    return handleTicketClose(interaction);
  }
}
