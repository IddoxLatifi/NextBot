const { EmbedBuilder } = require("discord.js")
const ghostPingConfig = require("../config/ghostping")
const MessageUtils = require("../utils/messageUtils")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
module.exports = {
  name: "antiGhostPing",
  /**
   * @param {Client} client
   */
  init(client) {
    console.log("Anti Ghost Ping module initialized")
    client.recentMentions = new Map()
    setInterval(
      () => {
        const now = Date.now()
        for (const [messageId, data] of client.recentMentions) {
          if (now - data.timestamp > 10 * 60 * 1000) {
            client.recentMentions.delete(messageId)
          }
        }
      },
      10 * 60 * 1000,
    )
  },
  /**
   * @param {Message} message 
   * @param {Client} client 
   */
  async handleMessageCreate(message, client) {
    if (!ghostPingConfig.enabled) return
    if (message.author.bot) return
    if (ghostPingConfig.ignoredChannels.includes(message.channel.id)) return
    const hasMentions =
      (message.mentions.users.size > 0 && !this.shouldIgnoreUserMentions(message)) ||
      (message.mentions.roles.size > 0 && !this.shouldIgnoreRoleMentions(message))
    if (hasMentions) {
      client.recentMentions.set(message.id, {
        author: {
          id: message.author.id,
          tag: message.author.tag,
          avatar: message.author.displayAvatarURL(),
        },
        content: message.content,
        mentions: {
          users: Array.from(message.mentions.users.keys()),
          roles: Array.from(message.mentions.roles.keys()),
        },
        channel: message.channel.id,
        timestamp: Date.now(),
      })
    }
  },
  /**
   * @param {Message} message 
   * @returns {boolean} 
   */
  shouldIgnoreUserMentions(message) {
    return message.mentions.users.size === 0
  },
  /**
   * @param {Message} message 
   * @returns {boolean} 
   */
  shouldIgnoreRoleMentions(message) {
    if (message.mentions.roles.size === 0) return true
    return message.mentions.roles.every((role) => ghostPingConfig.ignoredRoles.includes(role.id))
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  async handleMessageDelete(message, client) {
    if (!ghostPingConfig.enabled) return
    if (message.author?.bot) return
    if (ghostPingConfig.ignoredChannels.includes(message.channel.id)) return
    const mentionData = client.recentMentions.get(message.id)
    if (mentionData) {
      const hasMentions = mentionData.mentions.users.length > 0 || mentionData.mentions.roles.length > 0
      if (hasMentions) {
        const embed = new EmbedBuilder()
          .setColor(ghostPingConfig.embed.color)
          .setTitle(ghostPingConfig.embed.title)
          .setDescription(ghostPingConfig.embed.description.replace("{username}", mentionData.author.tag))
        if (ghostPingConfig.embed.showTimestamp) {
          embed.setTimestamp()
        } else {
          embed.setTimestamp(null)
        }
        if (ghostPingConfig.embed.footer) {
          embed.setFooter({
            text: ghostPingConfig.embed.footer.replace("{timestamp}", new Date().toLocaleString()),
            iconURL: ghostPingConfig.embed.footerIconUrl,
          })
        }
        if (ghostPingConfig.fields.originalMessage.enabled) {
          const contentValue = mentionData.content || ghostPingConfig.messages.noContent
          embed.addFields({
            name: ghostPingConfig.fields.originalMessage.name,
            value: ghostPingConfig.fields.originalMessage.value.replace("{content}", contentValue),
          })
        }
        if (ghostPingConfig.fields.mentionedUsers.enabled && mentionData.mentions.users.length > 0) {
          const userMentions = mentionData.mentions.users.map((id) => `<@${id}>`).join(", ")
          embed.addFields({
            name: ghostPingConfig.fields.mentionedUsers.name,
            value: ghostPingConfig.fields.mentionedUsers.value.replace("{users}", userMentions),
          })
        }
        if (ghostPingConfig.fields.mentionedRoles.enabled && mentionData.mentions.roles.length > 0) {
          const roleMentions = mentionData.mentions.roles.map((id) => `<@&${id}>`).join(", ")
          embed.addFields({
            name: ghostPingConfig.fields.mentionedRoles.name,
            value: ghostPingConfig.fields.mentionedRoles.value.replace("{roles}", roleMentions),
          })
        }
        const sentMessage = await message.channel.send({ embeds: [embed] })
        const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
        if (ghostPingConfig.deleteDelay > 0) {
          setTimeout(() => {
            sentMessage.delete().catch((err) => {
              if (err.code !== 10008) {
                console.error("Error deleting ghost ping notification:", err)
              }
            })
          }, ghostPingConfig.deleteDelay * 1000)
        }
        client.recentMentions.delete(message.id)
      }
    }
  },
}
