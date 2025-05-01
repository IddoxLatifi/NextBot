const { EmbedBuilder } = require("discord.js")
const antiInviteConfig = require("../config/antiInvite")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
module.exports = {
  name: "antiInvite",
  /**
   * @param {Client} client
   */
  init(client) {
    console.log("Anti-Invite module initialized")
  },
  /**
   * @param {Message} message
   * @param {Client} client 
   * @returns {Promise<boolean>}
   */
  async handleMessage(message, client) {
    if (!antiInviteConfig || !antiInviteConfig.enabled) return false
    if (message.author.bot) return false
    if (message.member && message.member.permissions.has("Administrator")) return false
    if (antiInviteConfig.exemptChannels && antiInviteConfig.exemptChannels.includes(message.channel.id)) return false
    if (antiInviteConfig.exemptUsers && antiInviteConfig.exemptUsers.includes(message.author.id)) return false
    if (
      message.member &&
      antiInviteConfig.exemptRoles &&
      message.member.roles.cache.some((role) => antiInviteConfig.exemptRoles.includes(role.id))
    ) {
      return false
    }
    if (!antiInviteConfig.inviteRegex) return false
    const inviteMatch = message.content.match(antiInviteConfig.inviteRegex)
    if (!inviteMatch) return false
    try {
      console.log(`Discord invite link detected from ${message.author.tag}: ${inviteMatch[0]}`)
      if (antiInviteConfig.punishment?.enabled && message.member) {
        console.log(`Applying punishment to ${message.author.tag}`)
        await this.punishMember(message.member, client)
      }
      if (antiInviteConfig.deleteMessage) {
        await message.delete().catch((err) => {
          console.error("Error deleting invite message:", err)
        })
      }
      if (antiInviteConfig.sendWarning) {
        const embed = new EmbedBuilder()
          .setColor(antiInviteConfig.embed.color)
          .setTitle(antiInviteConfig.embed.title)
          .setDescription(antiInviteConfig.embed.description.replace("{username}", message.author.username))
        if (antiInviteConfig.embed.showTimestamp) {
          embed.setTimestamp()
        }
        if (antiInviteConfig.embed.footer) {
          embed.setFooter({
            text: antiInviteConfig.embed.footer,
            iconURL: antiInviteConfig.embed.footerIconUrl,
          })
        }
        const warningMessage = await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [embed],
        })
        if (antiInviteConfig.deleteWarningDelay > 0) {
          setTimeout(() => {
            warningMessage.delete().catch((err) => {
              console.error("Error deleting warning message:", err)
            })
          }, antiInviteConfig.deleteWarningDelay * 1000)
        }
      }
      if (antiInviteConfig.logging && antiInviteConfig.logging.enabled && antiInviteConfig.logging.channelId) {
        await this.logInvite(message, client, inviteMatch[0])
      }
      return true
    } catch (error) {
      console.error("Error in anti-invite module:", error)
      return false
    }
  },
  /**
   * @param {GuildMember} member 
   * @param {Client} client
   */
  async punishMember(member, client) {
    try {
      if (!antiInviteConfig.punishment) return
      const punishmentType = antiInviteConfig.punishment.type
      const reason = antiInviteConfig.punishment.reason || "Violation of server rules"
      if (punishmentType === "mute") {
        const muteDurationMs = antiInviteConfig.punishment.muteDuration * 60 * 1000 
        await member.timeout(muteDurationMs, reason)
        console.log(`Muted member ${member.user.tag} for ${antiInviteConfig.punishment.muteDuration} minutes`)
      } else if (punishmentType === "kick") {
        await member.kick(reason)
        console.log(`Kicked member ${member.user.tag}`)
      } else if (punishmentType === "ban") {
        await member.ban({ reason: reason })
        console.log(`Banned member ${member.user.tag}`)
      }
    } catch (error) {
      console.error(`Error punishing member ${member.user.tag}:`, error)
    }
  },
  /**
   * @param {Message} message 
   * @param {Client} client 
   * @param {string} inviteLink 
   */
  async logInvite(message, client, inviteLink) {
    try {
      if (!antiInviteConfig.logging || !antiInviteConfig.logging.enabled || !antiInviteConfig.logging.channelId) {
        console.log("Invite logging is disabled or no log channel configured")
        return
      }
      console.log(`Attempting to log invite to channel ID: ${antiInviteConfig.logging.channelId}`)
      const logChannel = await client.channels.fetch(antiInviteConfig.logging.channelId).catch((err) => {
        console.error(`Error fetching log channel: ${err}`)
        return null
      })
      if (!logChannel) {
        console.error(`Log channel ${antiInviteConfig.logging.channelId} not found`)
        return
      }
      console.log(`Found log channel: ${logChannel.name}`)
      const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
      const embed = new EmbedBuilder()
        .setColor(antiInviteConfig.embed.color)
        .setTitle("Discord Invite Link Detected")
        .setDescription(
          `A Discord invite link was detected and ${antiInviteConfig.deleteMessage ? "deleted" : "recognized"}.`,
        )
        .addFields(
          { name: "User", value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
          { name: "Invite Link", value: inviteLink, inline: false },
          {
            name: "Message Content",
            value: message.content.length > 1024 ? message.content.substring(0, 1021) + "..." : message.content,
            inline: false,
          },
        )
        .setTimestamp()
      try {
        await logChannel.send({ embeds: [embed] })
        console.log("Invite log message sent successfully")
      } catch (err) {
        console.error(`Error sending log message: ${err}`)
      }
    } catch (error) {
      console.error("Error logging invite:", error)
    }
  },
}