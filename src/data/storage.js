/**
 * Data Storage - Persistent file-based storage for bot configuration
 * Automatically saves to JSON file and loads on startup
 * This is ready for future web dashboard integration
 */

import log from '../utils/colors.js';
import fs from 'fs';
import path from 'path';

// Railway Volumes mount at /app/data, fallback to local ./data for development
const DATA_DIR = process.env.DATA_PATH || path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'config.json');

// Storage objects for bot configuration
let reactionRoles = new Map(); // messageId -> roleConfig[]
let buttonRoles = new Map(); // messageId -> roleConfig[]
let welcomeConfigs = new Map(); // guildId -> welcomeConfig
let leaveConfigs = new Map(); // guildId -> leaveConfig
let levelingConfigs = new Map(); // guildId -> levelingConfig
let userLevels = new Map(); // guildId-userId -> { xp, level }
let scheduledMessages = new Map(); // guildId -> scheduledMessage[]
let ticketConfigs = new Map(); // guildId -> ticketConfig
let tickets = new Map(); // guildId -> ticket[]

let botClient = null;

/**
 * Set the Discord client instance for event emission
 * This allows the storage module to notify handlers when configurations are reset
 * @param {Client} client - Discord client instance
 */
export function setBotClient(client) {
  botClient = client;
  log.system('Bot client registered with storage module for cache management');
}

/**
 * Ensure data directory exists with proper error handling for Railway
 * Made write test non-fatal for Railway volume mounting compatibility
 */
function ensureDataDirectory() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      log.system(`Created data directory at: ${DATA_DIR}`);
    }

    // Try to test write permissions, but don't fail if it doesn't work initially
    // Railway volumes may take a moment to mount with proper permissions
    try {
      const testFile = path.join(DATA_DIR, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      log.success('Data directory is writable and ready for persistent storage');
    } catch (writeError) {
      // Log warning but continue - Railway volume might become writable after init
      log.warn('Initial write test failed - Railway volume may still be mounting');
      log.warn('Configurations will be saved once volume is ready');
      log.info(`Data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    log.error('Failed to create data directory', error);
    log.warn('Bot will continue but configurations may not persist!');
  }
}

// Ensure directory exists on module load
ensureDataDirectory();

/**
 * Load all configurations from file on startup
 */
export function loadAllConfigs() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));

      if (data.reactionRoles) {
        reactionRoles = new Map(data.reactionRoles);
      }
      if (data.buttonRoles) {
        buttonRoles = new Map(data.buttonRoles);
      }
      if (data.welcomeConfigs) {
        welcomeConfigs = new Map(data.welcomeConfigs);
      }
      if (data.leaveConfigs) {
        leaveConfigs = new Map(data.leaveConfigs);
      }
      if (data.levelingConfigs) {
        levelingConfigs = new Map(data.levelingConfigs);
      }
      if (data.userLevels) {
        userLevels = new Map(data.userLevels);
      }
      if (data.scheduledMessages) {
        scheduledMessages = new Map(data.scheduledMessages);
      }
      if (data.ticketConfigs) {
        ticketConfigs = new Map(data.ticketConfigs);
      }
      if (data.tickets) {
        tickets = new Map(data.tickets);
      }

      log.success(`Loaded configurations from: ${STORAGE_FILE}`);
      log.info(
        `Loaded: ${reactionRoles.size} reaction roles, ${buttonRoles.size} button roles, ${welcomeConfigs.size} welcome configs, ${leaveConfigs.size} leave configs`
      );
      log.info(
        `Loaded: ${levelingConfigs.size} leveling configs, ${userLevels.size} user levels, ${scheduledMessages.size} scheduled messages`
      );
      log.info(`Loaded: ${ticketConfigs.size} ticket configs, ${tickets.size} ticket servers`);
      log.success('Persistent storage verified - configurations survived restart!');
    } else {
      log.info('No existing configuration file found, starting fresh');
      log.warn('Remember to configure bot using slash commands!');
    }
  } catch (error) {
    log.error('Failed to load configurations from file', error);
    log.warn('Starting with empty configuration - please reconfigure the bot');
  }
}

/**
 * Save all configurations to file with enhanced error handling
 * Fixed: Improved Railway volume compatibility with retry mechanism
 */
function saveToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o777 });
      log.system(`Created data directory at: ${DATA_DIR}`);
    }

    const data = {
      reactionRoles: Array.from(reactionRoles.entries()),
      buttonRoles: Array.from(buttonRoles.entries()),
      welcomeConfigs: Array.from(welcomeConfigs.entries()),
      leaveConfigs: Array.from(leaveConfigs.entries()),
      levelingConfigs: Array.from(levelingConfigs.entries()),
      userLevels: Array.from(userLevels.entries()),
      scheduledMessages: Array.from(scheduledMessages.entries()),
      ticketConfigs: Array.from(ticketConfigs.entries()),
      tickets: Array.from(tickets.entries()),
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    };

    const jsonData = JSON.stringify(data, null, 2);

    let writeSuccess = false;

    // Strategy 1: Direct write with explicit permissions
    if (!writeSuccess) {
      try {
        fs.writeFileSync(STORAGE_FILE, jsonData, { encoding: 'utf8', mode: 0o666 });
        writeSuccess = true;
        log.system(`Saved configurations to: ${STORAGE_FILE}`);
      } catch (error) {
        // Continue to next strategy
      }
    }

    // Strategy 2: Temp file with rename (atomic write)
    if (!writeSuccess) {
      try {
        const tempFile = `${STORAGE_FILE}.tmp`;
        fs.writeFileSync(tempFile, jsonData, { encoding: 'utf8', mode: 0o666 });
        fs.renameSync(tempFile, STORAGE_FILE);
        writeSuccess = true;
        log.system(`Saved configurations to: ${STORAGE_FILE} (temp file method)`);
      } catch (error) {
        // Continue to next strategy
      }
    }

    // Strategy 3: Write to alternative location and copy
    if (!writeSuccess) {
      try {
        const altFile = path.join('/tmp', 'config.json');
        fs.writeFileSync(altFile, jsonData, { encoding: 'utf8' });
        fs.copyFileSync(altFile, STORAGE_FILE);
        fs.unlinkSync(altFile);
        writeSuccess = true;
        log.system(`Saved configurations to: ${STORAGE_FILE} (alternative path method)`);
      } catch (error) {
        // Continue to error handling
      }
    }

    if (writeSuccess) {
      log.success('All configurations persisted successfully!');
    } else {
      throw new Error('All write strategies failed');
    }
  } catch (error) {
    log.error('Failed to save configurations to file', error);
    log.failed('CRITICAL: Changes may be lost on restart!');
    log.warn('Check Railway Volume configuration and permissions in dashboard');

    if (error.code === 'EACCES') {
      log.error(`Permission denied writing to: ${STORAGE_FILE}`);
      log.warn('Railway volume may need permission adjustment');
      log.info('Trying to fix permissions...');

      try {
        fs.chmodSync(DATA_DIR, 0o777);
        log.success('Fixed data directory permissions - next save should work');
      } catch (chmodError) {
        log.error('Could not fix permissions automatically');
      }
    } else {
      log.error(`Write error: ${error.message}`);
    }
  }
}

/**
 * REACTION ROLES STORAGE
 */

/**
 * Save reaction role configuration
 * @param {string} messageId - Discord message ID
 * @param {Array} config - Role configuration array
 */
export function saveReactionRoleConfig(messageId, config) {
  reactionRoles.set(messageId, config);
  saveToFile(); // Persist to file
  log.system(`Saved reaction role config for message: ${messageId}`);
  log.info(`Roles configured: ${config.length}`);
}

/**
 * Get reaction role configuration
 * @param {string} messageId - Discord message ID
 * @returns {Array|null} Role configuration or null
 */
export function getReactionRoleConfig(messageId) {
  return reactionRoles.get(messageId) || null;
}

/**
 * Remove reaction role configuration
 * @param {string} messageId - Discord message ID
 * @returns {boolean} True if removed, false if not found
 */
export function removeReactionRoleConfig(messageId) {
  const result = reactionRoles.delete(messageId);
  if (result) {
    saveToFile(); // Persist to file
    log.system(`Removed reaction role config for message: ${messageId}`);
  }
  return result;
}

/**
 * Get all reaction role configurations
 * @returns {Map} All reaction role configs
 */
export function getAllReactionRoleConfigs() {
  return reactionRoles;
}

/**
 * Get all reaction role message IDs for a specific guild
 * Used for cleaning up messages during reset
 * @param {string} guildId - Discord guild ID
 * @returns {Array<string>} Array of message IDs
 */
export function getGuildReactionRoleMessages(guildId) {
  const messageIds = [];
  for (const [messageId, config] of reactionRoles.entries()) {
    if (config && config.length > 0 && config[0]?.guildId === guildId) {
      messageIds.push(messageId);
    }
  }
  return messageIds;
}

/**
 * BUTTON ROLES STORAGE
 */

/**
 * Save button role configuration
 * @param {string} messageId - Discord message ID
 * @param {Array} config - Role configuration array
 */
export function saveButtonRoleConfig(messageId, config) {
  buttonRoles.set(messageId, config);
  saveToFile(); // Persist to file
  log.system(`Saved button role config for message: ${messageId}`);
  log.info(`Roles configured: ${config.length}`);
}

/**
 * Get button role configuration
 * @param {string} messageId - Discord message ID
 * @returns {Array|null} Role configuration or null
 */
export function getButtonRoleConfig(messageId) {
  return buttonRoles.get(messageId) || null;
}

/**
 * Remove button role configuration
 * @param {string} messageId - Discord message ID
 * @returns {boolean} True if removed, false if not found
 */
export function removeButtonRoleConfig(messageId) {
  const result = buttonRoles.delete(messageId);
  if (result) {
    saveToFile(); // Persist to file
    log.system(`Removed button role config for message: ${messageId}`);
  }
  return result;
}

/**
 * Get all button role configurations
 * @returns {Map} All button role configs
 */
export function getAllButtonRoleConfigs() {
  return buttonRoles;
}

/**
 * Get all button role message IDs for a specific guild
 * Used for cleaning up messages during reset
 * @param {string} guildId - Discord guild ID
 * @returns {Array<string>} Array of message IDs
 */
export function getGuildButtonRoleMessages(guildId) {
  const messageIds = [];
  for (const [messageId, config] of buttonRoles.entries()) {
    if (config && config.length > 0 && config[0]?.guildId === guildId) {
      messageIds.push(messageId);
    }
  }
  return messageIds;
}

/**
 * WELCOME MESSAGE STORAGE
 */

/**
 * Save welcome message configuration
 * @param {string} guildId - Discord guild ID
 * @param {Object} config - Welcome configuration
 */
export function saveWelcomeConfig(guildId, config) {
  welcomeConfigs.set(guildId, config);
  saveToFile(); // Persist to file
  log.system(`Saved welcome config for guild: ${guildId}`);
  log.info(`Channel: ${config.channelId}, Color: ${config.embedColor}`);
}

/**
 * Get welcome message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {Object|null} Welcome config or null
 */
export function getWelcomeConfig(guildId) {
  return welcomeConfigs.get(guildId) || null;
}

/**
 * Remove welcome message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {boolean} True if removed, false if not found
 */
export function removeWelcomeConfig(guildId) {
  const result = welcomeConfigs.delete(guildId);
  if (result) {
    saveToFile(); // Persist to file
    log.system(`Removed welcome config for guild: ${guildId}`);
  }
  return result;
}

/**
 * LEAVE MESSAGE STORAGE
 */

/**
 * Save leave message configuration
 * @param {string} guildId - Discord guild ID
 * @param {Object} config - Leave configuration
 */
export function saveLeaveConfig(guildId, config) {
  leaveConfigs.set(guildId, config);
  saveToFile(); // Persist to file
  log.system(`Saved leave config for guild: ${guildId}`);
  log.info(`Channel: ${config.channelId}, Color: ${config.embedColor}`);
}

/**
 * Get leave message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {Object|null} Leave config or null
 */
export function getLeaveConfig(guildId) {
  return leaveConfigs.get(guildId) || null;
}

/**
 * Remove leave message configuration
 * @param {string} guildId - Discord guild ID
 * @returns {boolean} True if removed, false if not found
 */
export function removeLeaveConfig(guildId) {
  const result = leaveConfigs.delete(guildId);
  if (result) {
    saveToFile(); // Persist to file
    log.system(`Removed leave config for guild: ${guildId}`);
  }
  return result;
}

/**
 * LEVELING SYSTEM STORAGE
 */

/**
 * Save leveling configuration for a guild
 * @param {string} guildId - Discord guild ID
 * @param {Object} config - Leveling configuration
 */
export function saveLevelingConfig(guildId, config) {
  levelingConfigs.set(guildId, config);
  saveToFile();
  log.system(`Saved leveling config for guild: ${guildId}`);
  log.info(`Enabled: ${config.enabled}, XP range: ${config.xpMin}-${config.xpMax}`);
}

/**
 * Get leveling configuration for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Object|null} Leveling config or null
 */
export function getLevelingConfig(guildId) {
  return levelingConfigs.get(guildId) || null;
}

/**
 * Get user level data
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @returns {Object} User level data { xp, level }
 */
export function getUserLevel(guildId, userId) {
  const key = `${guildId}-${userId}`;
  return userLevels.get(key) || { xp: 0, level: 0 };
}

/**
 * Add XP to user and return new total
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @param {number} xpAmount - Amount of XP to add
 * @returns {number} New total XP
 */
export function addUserXP(guildId, userId, xpAmount) {
  const key = `${guildId}-${userId}`;
  const current = userLevels.get(key) || { xp: 0, level: 0 };
  current.xp += xpAmount;

  userLevels.set(key, current);
  saveToFile();

  return current.xp;
}

/**
 * Get leaderboard for a guild
 * @param {string} guildId - Discord guild ID
 * @param {number} limit - Number of top users to return
 * @returns {Array} Sorted array of user level data
 */
export function getGuildLeaderboard(guildId, limit = 10) {
  const guildUsers = [];

  for (const [key, data] of userLevels) {
    if (key.startsWith(`${guildId}-`)) {
      const userId = key.split('-')[1];
      guildUsers.push({ userId, ...data });
    }
  }

  return guildUsers.sort((a, b) => b.xp - a.xp).slice(0, limit);
}

/**
 * SCHEDULED MESSAGES STORAGE
 */

/**
 * Save scheduled message configuration
 * @param {string} guildId - Discord guild ID
 * @param {Object} message - Scheduled message configuration
 */
export function saveScheduledMessage(guildId, message) {
  const current = scheduledMessages.get(guildId) || [];
  const index = current.findIndex((m) => m.id === message.id);

  if (index >= 0) {
    current[index] = message;
  } else {
    current.push(message);
  }

  scheduledMessages.set(guildId, current);
  saveToFile();
  log.system(`Saved scheduled message for guild: ${guildId}`);
  log.info(`Message: ${message.name}, Type: ${message.schedule.type}`);
}

/**
 * Get all scheduled messages
 * @returns {Map} All scheduled messages
 */
export function getScheduledMessages() {
  return scheduledMessages;
}

/**
 * Get scheduled messages for a specific guild
 * @param {string} guildId - Discord guild ID
 * @returns {Array} Scheduled messages for guild
 */
export function getGuildScheduledMessages(guildId) {
  return scheduledMessages.get(guildId) || [];
}

/**
 * Remove scheduled message
 * @param {string} guildId - Discord guild ID
 * @param {string} messageId - Message ID
 * @returns {boolean} True if removed
 */
export function removeScheduledMessage(guildId, messageId) {
  const current = scheduledMessages.get(guildId) || [];
  const filtered = current.filter((m) => m.id !== messageId);

  if (filtered.length < current.length) {
    scheduledMessages.set(guildId, filtered);
    saveToFile();
    log.system(`Removed scheduled message: ${messageId}`);
    return true;
  }

  return false;
}

/**
 * TICKET SYSTEM STORAGE
 */

/**
 * Save ticket configuration for a guild
 * @param {string} guildId - Discord guild ID
 * @param {Object} config - Ticket configuration
 */
export function saveTicketConfig(guildId, config) {
  if (config.staffRoleId && !config.staffRoleIds) {
    config.staffRoleIds = [config.staffRoleId];
  }

  ticketConfigs.set(guildId, config);
  saveToFile();
  log.system(`Saved ticket config for guild: ${guildId}`);
  log.info(`Panel: ${config.panelChannelId}, Category: ${config.categoryId}`);
  log.info(`Staff roles: ${config.staffRoleIds?.length || 0} configured`);
}

/**
 * Get ticket configuration for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Object|null} Ticket config or null
 */
export function getTicketConfig(guildId) {
  return ticketConfigs.get(guildId) || null;
}

/**
 * Create a new ticket
 * @param {string} guildId - Discord guild ID
 * @param {Object} ticketData - Ticket data
 */
export function createTicket(guildId, ticketData) {
  const current = tickets.get(guildId) || [];
  current.push(ticketData);
  tickets.set(guildId, current);

  const config = ticketConfigs.get(guildId);
  if (config) {
    config.ticketCount = (config.ticketCount || 0) + 1;
    ticketConfigs.set(guildId, config);
  }

  saveToFile();
  log.system(`Created ticket ${ticketData.ticketNumber} for guild: ${guildId}`);
}

/**
 * Get a specific ticket by ID
 * @param {string} guildId - Discord guild ID
 * @param {string} ticketId - Ticket ID
 * @returns {Object|null} Ticket data or null
 */
export function getTicket(guildId, ticketId) {
  const guildTickets = tickets.get(guildId) || [];
  return guildTickets.find((t) => t.id === ticketId) || null;
}

/**
 * Update ticket data
 * @param {string} guildId - Discord guild ID
 * @param {string} ticketId - Ticket ID
 * @param {Object} updates - Data to update
 */
export function updateTicket(guildId, ticketId, updates) {
  const guildTickets = tickets.get(guildId) || [];
  const ticketIndex = guildTickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex >= 0) {
    guildTickets[ticketIndex] = { ...guildTickets[ticketIndex], ...updates };
    tickets.set(guildId, guildTickets);
    saveToFile();
    log.system(`Updated ticket ${ticketId}`);
  }
}

/**
 * Close a ticket
 * @param {string} guildId - Discord guild ID
 * @param {string} ticketId - Ticket ID
 */
export function closeTicket(guildId, ticketId) {
  const guildTickets = tickets.get(guildId) || [];
  const ticketIndex = guildTickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex >= 0) {
    guildTickets[ticketIndex].status = 'closed';
    guildTickets[ticketIndex].closedAt = Date.now();
    tickets.set(guildId, guildTickets);
    saveToFile();
    log.system(`Closed ticket ${ticketId}`);
  }
}

/**
 * Get active tickets for a guild or user
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Optional user ID to filter
 * @returns {Array} Active tickets
 */
export function getActiveTickets(guildId, userId = null) {
  const guildTickets = tickets.get(guildId) || [];
  let activeTickets = guildTickets.filter((t) => t.status === 'open' || t.status === 'claimed');

  if (userId) {
    activeTickets = activeTickets.filter((t) => t.userId === userId);
  }

  return activeTickets;
}

/**
 * RESET ALL CONFIGURATIONS
 */

/**
 * Reset all configurations for a specific guild
 * FIXED: Now properly clears in-memory caches and notifies all handlers
 * ENHANCED: Deletes all bot configuration messages (reaction role panels, ticket panels)
 * CRITICAL FIX: Emits reset event BEFORE clearing storage so handlers can access data
 * @param {string} guildId - Discord guild ID
 */
export async function resetGuildConfig(guildId) {
  log.system(`[RESET] Starting configuration reset for guild: ${guildId}`);

  let deletedMessages = 0;

  if (botClient) {
    log.system('[RESET] Notifying handlers to clear caches before data deletion...');
    botClient.emit('guildConfigReset', guildId);

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (botClient) {
    log.system('[RESET] Deleting reaction role panel messages...');
    for (const [messageId, config] of reactionRoles.entries()) {
      // Check if any role in the config belongs to this guild
      if (config && config.length > 0 && config[0]?.guildId === guildId) {
        try {
          // Get channel and message IDs from config
          const channelId = config[0]?.channelId;
          if (channelId) {
            const channel = await botClient.channels.fetch(channelId).catch(() => null);
            if (channel) {
              const message = await channel.messages.fetch(messageId).catch(() => null);
              if (message) {
                await message.delete();
                deletedMessages++;
                log.system(`[RESET] Deleted reaction role message: ${messageId}`);
              }
            }
          }
        } catch (error) {
          log.warn(`[RESET] Could not delete reaction role message ${messageId}: ${error.message}`);
        }
      }
    }

    const ticketConfig = ticketConfigs.get(guildId);
    if (ticketConfig && ticketConfig.panelMessageId) {
      try {
        const channel = await botClient.channels
          .fetch(ticketConfig.panelChannelId)
          .catch(() => null);
        if (channel) {
          const message = await channel.messages
            .fetch(ticketConfig.panelMessageId)
            .catch(() => null);
          if (message) {
            await message.delete();
            deletedMessages++;
            log.system(`[RESET] Deleted ticket panel message: ${ticketConfig.panelMessageId}`);
          }
        }
      } catch (error) {
        log.warn(`[RESET] Could not delete ticket panel message: ${error.message}`);
      }
    }
  } else {
    log.warn('[RESET] Bot client not set, cannot delete configuration messages or notify handlers');
  }

  welcomeConfigs.delete(guildId);
  leaveConfigs.delete(guildId);
  levelingConfigs.delete(guildId);

  const hadScheduledMessages = scheduledMessages.has(guildId);
  scheduledMessages.delete(guildId);

  ticketConfigs.delete(guildId);
  tickets.delete(guildId);

  let removedCount = 0;
  for (const [messageId, config] of reactionRoles.entries()) {
    // Check if any role in the config belongs to this guild
    if (config && config.length > 0 && config[0]?.guildId === guildId) {
      reactionRoles.delete(messageId);
      removedCount++;
      log.system(`[RESET] Removed reaction role config for message: ${messageId}`);
    }
  }

  let buttonRemovedCount = 0;
  for (const [messageId, config] of buttonRoles.entries()) {
    // Check if any role in the config belongs to this guild
    if (config && config.length > 0 && config[0]?.guildId === guildId) {
      buttonRoles.delete(messageId);
      buttonRemovedCount++;
      log.system(`[RESET] Removed button role config for message: ${messageId}`);
    }
  }

  let removedLevels = 0;
  for (const [key] of userLevels) {
    if (key.startsWith(`${guildId}-`)) {
      userLevels.delete(key);
      removedLevels++;
    }
  }

  saveToFile();

  log.success(`[RESET] Configuration reset complete for guild: ${guildId}`);
  log.info(
    `[RESET] Removed: welcome config, leave config, ${removedCount} reaction role configs, ${buttonRemovedCount} button role configs, leveling config, ${removedLevels} user levels, ${hadScheduledMessages ? 'scheduled messages' : 'no scheduled messages'}, ticket config`
  );
  log.info(`[RESET] Deleted ${deletedMessages} configuration message(s) from server`);

  return {
    welcomeRemoved: true,
    leaveRemoved: true,
    reactionRolesRemoved: removedCount,
    buttonRolesRemoved: buttonRemovedCount,
    levelingRemoved: true,
    userLevelsRemoved: removedLevels,
    scheduledMessagesRemoved: hadScheduledMessages,
    ticketConfigRemoved: true,
    messagesDeleted: deletedMessages
  };
}

/**
 * UTILITY FUNCTIONS FOR FUTURE WEB DASHBOARD
 */

/**
 * Export all configurations (for backup or web dashboard)
 * @returns {Object} All configurations
 */
export function exportAllConfigs() {
  log.info('Exporting all configurations');
  return {
    reactionRoles: Array.from(reactionRoles.entries()),
    buttonRoles: Array.from(buttonRoles.entries()),
    welcomeConfigs: Array.from(welcomeConfigs.entries()),
    leaveConfigs: Array.from(leaveConfigs.entries()),
    levelingConfigs: Array.from(levelingConfigs.entries()),
    userLevels: Array.from(userLevels.entries()),
    scheduledMessages: Array.from(scheduledMessages.entries()),
    ticketConfigs: Array.from(ticketConfigs.entries()),
    tickets: Array.from(tickets.entries())
  };
}

/**
 * Import configurations (for restore or web dashboard)
 * @param {Object} data - Configuration data to import
 */
export function importConfigs(data) {
  if (data.reactionRoles) {
    data.reactionRoles.forEach(([key, value]) => reactionRoles.set(key, value));
  }
  if (data.buttonRoles) {
    data.buttonRoles.forEach(([key, value]) => buttonRoles.set(key, value));
  }
  if (data.welcomeConfigs) {
    data.welcomeConfigs.forEach(([key, value]) => welcomeConfigs.set(key, value));
  }
  if (data.leaveConfigs) {
    data.leaveConfigs.forEach(([key, value]) => leaveConfigs.set(key, value));
  }
  if (data.levelingConfigs) {
    data.levelingConfigs.forEach(([key, value]) => levelingConfigs.set(key, value));
  }
  if (data.userLevels) {
    data.userLevels.forEach(([key, value]) => userLevels.set(key, value));
  }
  if (data.scheduledMessages) {
    data.scheduledMessages.forEach(([key, value]) => scheduledMessages.set(key, value));
  }
  if (data.ticketConfigs) {
    data.ticketConfigs.forEach(([key, value]) => ticketConfigs.set(key, value));
  }
  if (data.tickets) {
    data.tickets.forEach(([key, value]) => tickets.set(key, value));
  }
  saveToFile();
  log.success('Configurations imported successfully');
  log.info(
    `Imported: ${data.reactionRoles?.length || 0} reaction roles, ${data.buttonRoles?.length || 0} button roles, ${data.welcomeConfigs?.length || 0} welcome configs, ${data.leaveConfigs?.length || 0} leave configs, ${data.ticketConfigs?.length || 0} ticket configs`
  );
}

/**
 * Get storage statistics for monitoring
 * Useful for web dashboard and debugging
 */
export function getStorageStats() {
  try {
    const stats = fs.statSync(STORAGE_FILE);
    return {
      exists: true,
      path: STORAGE_FILE,
      size: stats.size,
      modified: stats.mtime,
      reactionRoleCount: reactionRoles.size,
      buttonRoleCount: buttonRoles.size,
      welcomeConfigCount: welcomeConfigs.size,
      leaveConfigCount: leaveConfigs.size,
      levelingConfigCount: levelingConfigs.size,
      userLevelCount: userLevels.size,
      scheduledMessageCount: scheduledMessages.size,
      ticketConfigCount: ticketConfigs.size,
      ticketCount: tickets.size
    };
  } catch (error) {
    return {
      exists: false,
      path: STORAGE_FILE,
      error: error.message
    };
  }
}
