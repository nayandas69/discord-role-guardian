/**
 * Discord Role Guardian Bot - Main Entry Point
 * Discord bot with reaction roles, welcome/leave messages
 * Author: nayandas69
 * Repository: https://github.com/nayandas69/discord-role-guardian
 */

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import http from 'http';
import { registerCommands } from './utils/commandRegistry.js';
import { setupReactionRoleHandler } from './handlers/reactionRoles.js';
import { setupMemberEvents } from './handlers/memberEvents.js';
import { startActivityRotation } from './utils/activityManager.js';
import { handleInteractionCreate } from './handlers/interactionHandler.js';
import log from './utils/colors.js';
import { loadAllConfigs, setBotClient } from './data/storage.js';
import { setupLevelingSystem } from './handlers/levelingSystem.js';
import {
  setupScheduledMessages,
  cancelAllScheduledMessages
} from './handlers/scheduledMessages.js';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = ['DISCORD_TOKEN', 'CLIENT_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    log.failed(`Missing required environment variables: ${missing.join(', ')}`);
    log.warn('Please check your .env file and ensure all required variables are set');
    process.exit(1);
  }
}

// Validate environment before starting
validateEnvironment();

/**
 * Initialize Discord client with required intents and partials
 * Intents: Permissions for bot to receive specific events
 * Partials: Allow bot to receive events for uncached data
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Access to guild information
    GatewayIntentBits.GuildMessages, // Read messages in guilds
    GatewayIntentBits.GuildMessageReactions, // Detect reaction events
    GatewayIntentBits.GuildMembers, // Track member join/leave
    GatewayIntentBits.MessageContent // Read message content
  ],
  partials: [
    Partials.Message, // Receive events for uncached messages
    Partials.Channel, // Receive events for uncached channels
    Partials.Reaction // Receive events for uncached reactions
  ]
});

/**
 * Create a simple HTTP server for health checks
 * This allows Railway, UptimeRobot, and other monitoring services to ping the bot
 * and verify it's running properly for 24/7 uptime monitoring
 */
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Health check endpoint for monitoring services
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        bot: client.user ? client.user.tag : 'connecting',
        uptime: process.uptime(),
        servers: client.guilds.cache.size,
        timestamp: new Date().toISOString(),
        storage: {
          configured: client.guilds.cache.size > 0,
          dataPath: process.env.DATA_PATH || 'local'
        }
      })
    );
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start HTTP server for health checks
server.listen(PORT, () => {
  log.system(`Health check server listening on port ${PORT}`);
  log.info(`UptimeRobot URL: https://discord-role-guardian-production.up.railway.app/health`);
  // Adjust the URL above based on your deployment platform
  // For Railway, it would be something like: `https://your-railway-app.up.railway.app/health`
});

/**
 * Bot Ready Event - Triggered when bot successfully connects to Discord
 */
client.once('clientReady', async () => {
  log.start(`Bot is online as ${client.user.tag}`);
  log.info(`Serving ${client.guilds.cache.size} server(s)`);
  log.info(`Monitoring ${client.users.cache.size} user(s)`);

  log.system('Loading persistent configurations from Railway Volume...');
  loadAllConfigs();

  setBotClient(client);

  // Register slash commands with Discord API
  try {
    await registerCommands(client);
    log.success('Slash commands registered successfully');
  } catch (error) {
    log.error('Failed to register commands', error);
  }

  // Start rotating bot activity status every 2-5 minutes
  startActivityRotation(client);

  // Initialize event handlers
  setupReactionRoleHandler(client);
  setupMemberEvents(client);

  setupLevelingSystem(client);
  setupScheduledMessages(client);

  log.system('All systems operational!');
});

/**
 * Interaction Handler - Process slash commands and button interactions
 */
client.on('interactionCreate', async (interaction) => {
  await handleInteractionCreate(interaction);
});

/**
 * Error Handling - Catch and log any unhandled errors
 */
client.on('error', (error) => {
  log.error('Discord client error', error);
});

process.on('unhandledRejection', (error) => {
  log.error('Unhandled promise rejection', error);
});

/**
 * Graceful Shutdown Handler
 * Properly closes Discord connection and HTTP server when process is terminated
 * This is important for Railway/cloud deployments to ensure clean restarts
 */
async function gracefulShutdown(signal) {
  log.warn(`Received ${signal} signal, shutting down gracefully...`);

  try {
    cancelAllScheduledMessages();

    // Close HTTP health check server
    server.close(() => {
      log.system('Health check server closed');
    });

    // Destroy Discord client connection
    client.destroy();
    log.system('Discord client disconnected');

    // Exit process successfully
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', error);
    process.exit(1);
  }
}

// Listen for termination signals from Railway/cloud platforms
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/**
 * Auto-reconnect handler for network issues
 * Ensures bot stays online 24/7 even with temporary connection problems
 */
client.on('disconnect', () => {
  log.warn('Bot disconnected from Discord, attempting to reconnect...');
});

client.on('reconnecting', () => {
  log.info('Reconnecting to Discord...');
});

/**
 * Start the bot - Connect to Discord
 */
log.start('Starting Discord Role Guardian Bot...');
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  log.failed('Failed to login to Discord');
  log.error('Login error', error);
  process.exit(1);
});
