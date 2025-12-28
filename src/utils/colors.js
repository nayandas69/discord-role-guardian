/**
 * Console Colors Utility
 * Provides colored console output for better readability
 * Uses ANSI escape codes for terminal colors
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  pink: '\x1b[38;5;213m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

/**
 * Colored console logging functions
 */
export const log = {
  // Success messages (green)
  success: (message) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
  },

  // Error messages (red)
  error: (message, error = null) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
    if (error) {
      console.error(`${colors.dim}${error.stack || error}${colors.reset}`);
    }
  },

  // Warning messages (yellow)
  warn: (message) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}`);
  },

  // Info messages (cyan)
  info: (message) => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`);
  },

  // System messages (blue)
  system: (message) => {
    console.log(`${colors.blue}[SYSTEM]${colors.reset} ${message}`);
  },

  // Command execution (magenta)
  command: (message) => {
    console.log(`${colors.magenta}[COMMAND]${colors.reset} ${message}`);
  },

  // Event messages (pink)
  event: (message) => {
    console.log(`${colors.pink}[EVENT]${colors.reset} ${message}`);
  },

  // Starting/restart messages (bright green)
  start: (message) => {
    console.log(`${colors.bright}${colors.green}[START]${colors.reset} ${message}`);
  },

  // Failed operations (bright red)
  failed: (message) => {
    console.error(`${colors.bright}${colors.red}[FAILED]${colors.reset} ${message}`);
  },

  // Security messages (bright yellow with red background for visibility)
  security: (message) => {
    console.log(
      `${colors.bright}${colors.bgRed}${colors.yellow}[SECURITY]${colors.reset} ${message}`
    );
  }
};

export default log;
