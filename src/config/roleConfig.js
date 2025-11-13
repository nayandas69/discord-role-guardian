/**
 * Role Configuration
 *
 * Centralized configuration for reaction roles
 * Update role IDs here after creating roles in your Discord server
 *
 * To get role IDs:
 * 1. Go to Server Settings -> Roles
 * 2. Right-click on a role -> Copy ID
 * 3. Replace the ROLE_ID_* placeholders below
 *
 * To use custom emojis:
 * 1. Type \:emoji_name: in Discord to get the emoji format
 * 2. Custom emojis look like <:name:id>
 */

export const ROLES = {
  GAMER: {
    id: "YOUR_GAMER_ROLE_ID",
    emoji: "🎮",
    name: "Gamer",
    description: "For gaming enthusiasts",
  },
  ARTIST: {
    id: "YOUR_ARTIST_ROLE_ID",
    emoji: "🎨",
    name: "Artist",
    description: "For creative artists",
  },
  DEVELOPER: {
    id: "YOUR_DEVELOPER_ROLE_ID",
    emoji: "💻",
    name: "Developer",
    description: "For programmers and developers",
  },
  MUSICIAN: {
    id: "YOUR_MUSICIAN_ROLE_ID",
    emoji: "🎵",
    name: "Musician",
    description: "For music lovers and creators",
  },
  READER: {
    id: "YOUR_READER_ROLE_ID",
    emoji: "📚",
    name: "Reader",
    description: "For book enthusiasts",
  },
}

/**
 * Get role ID by emoji
 * @param {string} emoji - The emoji to lookup
 * @returns {string|null} - Role ID or null if not found
 */
export function getRoleIdByEmoji(emoji) {
  const role = Object.values(ROLES).find((r) => r.emoji === emoji)
  return role?.id || null
}

/**
 * Get all configured emojis
 * @returns {string[]} - Array of emojis
 */
export function getAllEmojis() {
  return Object.values(ROLES).map((r) => r.emoji)
}
