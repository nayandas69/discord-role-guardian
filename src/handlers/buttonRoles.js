import { log } from '../utils/colors.js';
<<<<<<< HEAD
=======
import { getButtonRoleConfig } from '../data/storage.js';
import { MessageFlags, ActivityType } from 'discord.js';
import { setTemporaryStatus } from '../utils/activityManager.js';
>>>>>>> dev

/**
 * Handle button role interactions
 * @param {ButtonInteraction} interaction - Button interaction
 */
export async function handleButtonRole(interaction) {
  // Extract role ID from custom ID (format: button_role_ROLEID)
  if (!interaction.customId.startsWith('button_role_')) {
    return;
  }

  const roleId = interaction.customId.replace('button_role_', '');
  const member = interaction.member;
  const role = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    log.warn(`Button role not found: ${roleId}`);
    return interaction.reply({
      content: 'This role no longer exists!',
      ephemeral: true
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

      await interaction.reply({
        content: `Your **${role.name}** role has been removed!`,
        ephemeral: true
      });
    } else {
      setTemporaryStatus(
        `Assigning ${role.name} to ${member.user.username}`,
        ActivityType.Playing,
        3000
      );

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

      await interaction.reply({
        content: `You've been given the **${role.name}** role!`,
        ephemeral: true
      });
    }
  } catch (error) {
    log.error(`Failed to toggle role ${role.name} for ${member.user.tag}`);
    log.error(`Error: ${error.message}`);

    await interaction.reply({
      content: 'Failed to update your role. Please contact a server administrator!',
      ephemeral: true
    });
  }
}
