/**
 * Add Level Role Command - Configure roles for specific levels
 */

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { getLevelingConfig, saveLevelingConfig } from "../data/storage.js"
import log from "../utils/colors.js"

export const addLevelRoleCommand = {
  data: new SlashCommandBuilder()
    .setName("add-level-role")
    .setDescription("Add a role reward for reaching a specific level")
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("The level at which to award this role")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addRoleOption((option) => option.setName("role").setDescription("The role to award").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    try {
      const level = interaction.options.getInteger("level")
      const role = interaction.options.getRole("role")

      // Check if leveling is enabled
      const config = getLevelingConfig(interaction.guildId)
      if (!config || !config.enabled) {
        return interaction.editReply({
          content: "Leveling system is not enabled! Use `/setup-leveling` first.",
        })
      }

      // Check if role already exists for this level
      const existingIndex = config.levelRoles.findIndex((r) => r.level === level)
      if (existingIndex >= 0) {
        config.levelRoles[existingIndex] = { level, roleId: role.id, roleName: role.name }
      } else {
        config.levelRoles.push({ level, roleId: role.id, roleName: role.name })
      }

      // Sort by level
      config.levelRoles.sort((a, b) => a.level - b.level)

      // Save configuration
      saveLevelingConfig(interaction.guildId, config)

      // Create response
      const embed = {
        color: 0x00ff00,
        title: "Level Role Added",
        description: `${role} will now be awarded when members reach **Level ${level}**!`,
        fields: [
          {
            name: "All Level Roles",
            value: config.levelRoles.map((r) => `Level ${r.level}: <@&${r.roleId}>`).join("\n") || "None configured",
          },
        ],
        timestamp: new Date().toISOString(),
      }

      await interaction.editReply({ embeds: [embed] })
      log.success(`Added level ${level} role (${role.name}) in ${interaction.guild.name}`)
    } catch (error) {
      log.error("Error in add-level-role command", error)
      throw error
    }
  },
}
