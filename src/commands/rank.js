/**
 * Rank Command - Check user's level and XP
 */

import { SlashCommandBuilder } from 'discord.js';
import { getUserLevel, getLevelingConfig } from '../data/storage.js';
import log from '../utils/colors.js';

export const rankCommand = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level and XP')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to check (optional)').setRequired(false)
    )
    .setDMPermission(false), // Added setDMPermission(false) to prevent use in DMs and ensure proper server-only visibility

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;

      // Check if leveling is enabled
      const config = getLevelingConfig(interaction.guildId);
      if (!config || !config.enabled) {
        return interaction.editReply({
          content: 'Leveling system is not enabled in this server!'
        });
      }

      // Get user's level data
      const userData = getUserLevel(interaction.guildId, targetUser.id);
      const currentLevel = Math.floor(Math.sqrt(userData.xp / 100));
      const currentLevelXP = currentLevel * currentLevel * 100;
      const nextLevelXP = (currentLevel + 1) * (currentLevel + 1) * 100;
      const xpProgress = userData.xp - currentLevelXP;
      const xpNeeded = nextLevelXP - currentLevelXP;
      const percentage = Math.floor((xpProgress / xpNeeded) * 100);

      // Create progress bar
      const barLength = 10;
      const filledBars = Math.floor((percentage / 100) * barLength);
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);

      // Create embed
      const embed = {
        color: 0x0099ff,
        author: {
          name: `${targetUser.username}'s Rank`,
          icon_url: targetUser.displayAvatarURL()
        },
        fields: [
          {
            name: 'Level',
            value: `**${currentLevel}**`,
            inline: true
          },
          {
            name: 'Total XP',
            value: `**${userData.xp}**`,
            inline: true
          },
          {
            name: 'Progress to Next Level',
            value: `${progressBar} ${percentage}%\n${xpProgress}/${xpNeeded} XP`,
            inline: false
          }
        ],
        timestamp: new Date().toISOString()
      };

      await interaction.editReply({ embeds: [embed] });
      log.command(`Rank checked for ${targetUser.tag} by ${interaction.user.tag}`);
    } catch (error) {
      log.error('Error in rank command', error);
      throw error;
    }
  }
};
