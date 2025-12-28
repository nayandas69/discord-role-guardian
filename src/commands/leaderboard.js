/**
 * Leaderboard Command - Show top ranked members
 */

import { SlashCommandBuilder } from "discord.js"
import { getGuildLeaderboard, getLevelingConfig } from "../data/storage.js"
import log from "../utils/colors.js"

export const leaderboardCommand = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server XP leaderboard")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Number of users to show (default: 10)")
        .setMinValue(5)
        .setMaxValue(25)
        .setRequired(false),
    )
    .setDMPermission(false),

  async execute(interaction) {
    try {
      // Check if leveling is enabled
      const config = getLevelingConfig(interaction.guildId)
      if (!config || !config.enabled) {
        return interaction.editReply({
          content: "Leveling system is not enabled in this server!",
        })
      }

      const limit = interaction.options.getInteger("limit") || 10
      const leaderboard = getGuildLeaderboard(interaction.guildId, limit)

      if (leaderboard.length === 0) {
        return interaction.editReply({
          content: "No one has earned XP yet! Start chatting to earn XP!",
        })
      }

      // Format leaderboard
      const description = leaderboard
        .map((user, index) => {
          const level = Math.floor(Math.sqrt(user.xp / 100))
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`
          return `${medal} <@${user.userId}> - Level **${level}** (${user.xp} XP)`
        })
        .join("\n")

      const embed = {
        color: 0xffd700,
        title: `${interaction.guild.name} Leaderboard`,
        description,
        footer: {
          text: `Showing top ${leaderboard.length} members`,
        },
        timestamp: new Date().toISOString(),
      }

      await interaction.editReply({ embeds: [embed] })
      log.command(`Leaderboard viewed by ${interaction.user.tag}`)
    } catch (error) {
      log.error("Error in leaderboard command", error)
      throw error
    }
  },
}
