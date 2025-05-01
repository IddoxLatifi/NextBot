const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
class PermissionChecker {
  /**
   * @param {string} userId
   * @returns {boolean}
   */
  static isAdmin(userId) {
    return userId === process.env.ADMIN_ID
  }
  /**
   * @param {GuildMember} member 
   * @param {Array<PermissionResolvable>} permissions 
   * @returns {boolean} 
   */
  static hasPermissions(member, permissions) {
    if (!member) return false
    if (this.isAdmin(member.id)) return true
    return member.permissions.has(permissions)
  }
  /**
   * @param {Guild} guild 
   * @param {Array<PermissionResolvable>} permissions 
   * @returns {boolean} 
   */
  static botHasPermissions(guild, permissions) {
    if (!guild || !guild.members.me) return false
    return guild.members.me.permissions.has(permissions)
  }
  /**
   * @param {Interaction} interaction 
   * @param {Object} options 
   * @param {Array<PermissionResolvable>} options.userPermissions 
   * @param {Array<PermissionResolvable>} options.botPermissions
   * @param {boolean} options.adminOnly 
   * @returns {boolean} 
   */
  static canExecuteCommand(interaction, options = {}) {
    const { userPermissions = [], botPermissions = [], adminOnly = false } = options
    if (adminOnly && !this.isAdmin(interaction.user.id)) {
      return false
    }
    if (userPermissions.length > 0 && !this.hasPermissions(interaction.member, userPermissions)) {
      return false
    }
    if (botPermissions.length > 0 && !this.botHasPermissions(interaction.guild, botPermissions)) {
      return false
    }
    return true
  }
}
module.exports = PermissionChecker
