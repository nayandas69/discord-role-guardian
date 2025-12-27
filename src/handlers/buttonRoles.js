import { log } from '../utils/colors.js';
import { getButtonRoleConfig } from '../data/storage.js';
import { MessageFlags, ActivityType } from 'discord.js';
import { setTemporaryStatus } from '../utils/activityManager.js';

/**
 * Handle button role interactions
 * @param {ButtonInteraction} interaction - Button interaction
 */
export async function handleButtonRole(interaction) {
  // Extract role ID from custom ID (format: button_role_ROLEID)
  if (!interaction.customId.startsWith('button_role_')) {
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const config = getButtonRoleConfig(interaction.message.id);
  if (!config) {
    log.warn(`Button role configuration removed for message: ${interaction.message.id}`);
    return interaction.editReply({
      content: '❌ This button role configuration has been removed by an administrator!'
    });
  }

  const roleId = interaction.customId.replace('button_role_', '');

  const roleInConfig = config.some((r) => r.roleId === roleId);
  if (!roleInConfig) {
    log.warn(`Role ${roleId} not found in config for message: ${interaction.message.id}`);
    return interaction.editReply({
      content: '❌ This role is no longer available!'
    });
  }

  const member = interaction.member;
  const role = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    log.warn(`Button role not found: ${roleId}`);
    return interaction.editReply({
      content: 'This role no longer exists!'
    });
  }

  try {
    // Toggle role - add if user doesn't have it, remove if they do
    if (member.roles.cache.has(roleId)) {
      setTemporaryStatus(
        `Removing ${role.name} from ${member.user.username}`,
        ActivityType.Playing,
        3000
      );

      await member.roles.remove(role);
      log.info(`Removed role ${role.name} from ${member.user.tag}`);

      try {
        await member.user.send(
          `Your **${role.name}** role has been removed in **${interaction.guild.name}**.`
        );
        log.success(`Sent role removal DM to ${member.user.tag}`);
      } catch (dmError) {
        log.info(`Could not DM ${member.user.tag} (DMs disabled)`);
      }

      await interaction.editReply({
        content: `Your **${role.name}** role has been removed!`
      });
    } else {
      setTemporaryStatus(
        `Assigning ${role.name} to ${member.user.username}`,
        ActivityType.Playing,
        3000
      );
      setTemporaryStatus(`Assigning Role: ${user.username}`, ActivityType.Playing, 4000);

      await member.roles.add(role);
      log.success(`Added role ${role.name} to ${member.user.tag}`);

      try {
        await member.user.send(
          `You've been given the **${role.name}** role in **${interaction.guild.name}**!`
        );
        log.success(`Sent role assignment DM to ${member.user.tag}`);
      } catch (dmError) {
        log.info(`Could not DM ${member.user.tag} (DMs disabled)`);
      }

      await interaction.editReply({
        content: `You've been given the **${role.name}** role!`
      });
    }
  } catch (error) {
    log.error(`Failed to toggle role ${role.name} for ${member.user.tag}`);
    log.error(`Error: ${error.message}`);

    await interaction.editReply({
      content: 'Failed to update your role. Please contact a server administrator!'
    });
  }
}
