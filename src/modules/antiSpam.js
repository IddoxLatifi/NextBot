const { EmbedBuilder, Collection } = require("discord.js")
const antiSpamConfig = require("../config/antiSpam")
const Filter = require("bad-words")
const LinkifyIt = require("linkify-it")
module.exports = {
  name: "antiSpam",
  userMessages: new Collection(),
  cooldowns: new Collection(),
  filter: null,
  linkify: null,
  /**
   * @param {Client} client
   */
  init(client) {
    console.log("Anti-Spam module initialized")
    const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
    this.client = client
    this.filter = new Filter()
    if (antiSpamConfig.badWords?.additionalWords?.length > 0) {
      this.filter.addWords(...antiSpamConfig.badWords.additionalWords)
    }
    this.linkify = new LinkifyIt()
  },
  /**
   * @param {Message} message 
   * @param {Client} client 
   * @returns {Promise<boolean>} 
   */
  async handleMessage(message, client) {
    if (!antiSpamConfig || !antiSpamConfig.enabled) return false
    if (message.author.bot) return false
    if (message.member && message.member.permissions.has("Administrator")) return false
    if (antiSpamConfig.exemptChannels && antiSpamConfig.exemptChannels.includes(message.channel.id)) return false
    if (antiSpamConfig.exemptUsers && antiSpamConfig.exemptUsers.includes(message.author.id)) return false
    if (
      message.member &&
      antiSpamConfig.exemptRoles &&
      message.member.roles.cache.some((role) => antiSpamConfig.exemptRoles.includes(role.id))
    ) {
      return false
    }
    if (this.cooldowns.has(message.author.id)) {
      await message.delete().catch((err) => {
        console.error("Error deleting message during cooldown:", err)
      })
      return true
    }
    if (antiSpamConfig.badWords?.enabled && message.content) {
      if (this.filter.isProfane(message.content)) {
        console.log(`Bad word detected in message from ${message.author.tag}: ${message.content}`)
        await this.handleBadWord(message, client)
        return true
      }
    }
    if (antiSpamConfig.suspiciousLinks?.enabled && message.content) {
      const isSuspicious = await this.checkForSuspiciousLinks(message.content)
      if (isSuspicious) {
        console.log(`Suspicious link detected in message from ${message.author.tag}: ${message.content}`)
        await this.handleSuspiciousLink(message, client)
        return true
      }
    }
    this.addMessage(message)
    const userMessages = this.userMessages.get(message.author.id) || []
    const timeWindow = antiSpamConfig.timeWindow * 1000 
    const now = Date.now()
    const recentMessages = userMessages.filter((msg) => now - msg.createdTimestamp < timeWindow)

    if (recentMessages.length >= antiSpamConfig.maxMessages) {
      try {
        console.log(
          `Spam detected from ${message.author.tag} (${message.author.id}): ${recentMessages.length} messages in ${antiSpamConfig.timeWindow} seconds`,
        )
        this.cooldowns.set(message.author.id, true)
        setTimeout(() => {
          this.cooldowns.delete(message.author.id)
        }, antiSpamConfig.cooldownTime * 1000)
        if (antiSpamConfig.punishment?.enabled && message.member) {
          console.log(`Applying punishment to ${message.author.tag}`)
          await this.punishMember(message.member, client, "Sending spam messages")
        }
        console.log(`Deleting ${recentMessages.length} spam messages from ${message.author.tag}`)
        const deletionPromises = recentMessages.map((msg) =>
          msg.delete().catch((err) => console.error(`Error deleting spam message: ${err}`)),
        )
        await Promise.all(deletionPromises)
        if (antiSpamConfig.sendWarning) {
          const embed = new EmbedBuilder()
            .setColor(antiSpamConfig.embed.color)
            .setTitle(antiSpamConfig.embed.title)
            .setDescription(antiSpamConfig.embed.description.replace("{username}", message.author.username))
          if (antiSpamConfig.embed.showTimestamp) {
            embed.setTimestamp()
          }
          if (antiSpamConfig.embed.footer) {
            embed.setFooter({
              text: antiSpamConfig.embed.footer,
              iconURL: antiSpamConfig.embed.footerIconUrl,
            })
          }
          const warningMessage = await message.channel.send({
            content: `<@${message.author.id}>`,
            embeds: [embed],
          })
          if (antiSpamConfig.deleteWarningDelay > 0) {
            setTimeout(() => {
              warningMessage.delete().catch((err) => {
                console.error("Error deleting warning message:", err)
              })
            }, antiSpamConfig.deleteWarningDelay * 1000)
          }
        }
        if (antiSpamConfig.logging && antiSpamConfig.logging.enabled && antiSpamConfig.logging.channelId) {
          await this.logSpam(message, client, recentMessages.length, "Spam")
        }
        return true
      } catch (error) {
        console.error("Error in anti-spam module:", error)
        return false
      }
    }
    return false
  },
  /**
   * @param {string} text 
   * @returns {boolean} 
   */
  async checkForSuspiciousLinks(text) {
    if (!text) return false
    const matches = this.linkify.match(text)
    if (!matches) return false
    for (const match of matches) {
      const url = new URL(match.url)
      const hostname = url.hostname.toLowerCase()
      if (antiSpamConfig.suspiciousLinks.suspiciousDomains.some((domain) => hostname.includes(domain))) {
        return true
      }
    }
    return false
  },
  /**
   * @param {Message} message 
   * @param {Client} client 
   */
  async handleBadWord(message, client) {
    try {
      if (antiSpamConfig.badWords.deleteMessage) {
        await message.delete().catch((err) => {
          console.error("Error deleting message with bad word:", err)
        })
      }
      if (antiSpamConfig.badWords.punishUser && antiSpamConfig.punishment?.enabled && message.member) {
        await this.punishMember(message.member, client, "Use of profanity")
      }
      if (antiSpamConfig.sendWarning) {
        const embed = new EmbedBuilder()
          .setColor(antiSpamConfig.badWords.embed.color)
          .setTitle(antiSpamConfig.badWords.embed.title)
          .setDescription(antiSpamConfig.badWords.embed.description.replace("{username}", message.author.username))
        if (antiSpamConfig.badWords.embed.showTimestamp) {
          embed.setTimestamp()
        }
        if (antiSpamConfig.badWords.embed.footer) {
          embed.setFooter({
            text: antiSpamConfig.badWords.embed.footer,
            iconURL: antiSpamConfig.badWords.embed.footerIconUrl,
          })
        }
        const warningMessage = await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [embed],
        })
        if (antiSpamConfig.deleteWarningDelay > 0) {
          setTimeout(() => {
            warningMessage.delete().catch((err) => {
              console.error("Error deleting warning message:", err)
            })
          }, antiSpamConfig.deleteWarningDelay * 1000)
        }
      }
      if (antiSpamConfig.logging && antiSpamConfig.logging.enabled && antiSpamConfig.logging.channelId) {
        await this.logSpam(message, client, 1, "Bad Word")
      }
    } catch (error) {
      console.error("Error handling bad word:", error)
    }
  },
  /**
   * @param {Message} message
   * @param {Client} client 
   */
  async handleSuspiciousLink(message, client) {
    try {
      if (antiSpamConfig.suspiciousLinks.deleteMessage) {
        await message.delete().catch((err) => {
          console.error("Error deleting message with suspicious link:", err)
        })
      }
      if (antiSpamConfig.suspiciousLinks.punishUser && antiSpamConfig.punishment?.enabled && message.member) {
        await this.punishMember(message.member, client, "Sending suspicious links")
      }
      if (antiSpamConfig.sendWarning) {
        const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
        const embed = new EmbedBuilder()
          .setColor(antiSpamConfig.suspiciousLinks.embed.color)
          .setTitle(antiSpamConfig.suspiciousLinks.embed.title)
          .setDescription(
            antiSpamConfig.suspiciousLinks.embed.description.replace("{username}", message.author.username),
          )
        if (antiSpamConfig.suspiciousLinks.embed.showTimestamp) {
          embed.setTimestamp()
        }
        if (antiSpamConfig.suspiciousLinks.embed.footer) {
          embed.setFooter({
            text: antiSpamConfig.suspiciousLinks.embed.footer,
            iconURL: antiSpamConfig.suspiciousLinks.embed.footerIconUrl,
          })
        }
        const warningMessage = await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [embed],
        })
        if (antiSpamConfig.deleteWarningDelay > 0) {
          setTimeout(() => {
            warningMessage.delete().catch((err) => {
              console.error("Error deleting warning message:", err)
            })
          }, antiSpamConfig.deleteWarningDelay * 1000)
        }
      }
      if (antiSpamConfig.logging && antiSpamConfig.logging.enabled && antiSpamConfig.logging.channelId) {
        await this.logSpam(message, client, 1, "Suspicious Link")
      }
    } catch (error) {
      console.error("Error handling suspicious link:", error)
    }
  },
  /**
   * @param {Message} message 
   */
  addMessage(message) {
    const userId = message.author.id
    if (!this.userMessages.has(userId)) {
      this.userMessages.set(userId, [])
    }
    const userMessages = this.userMessages.get(userId)
    userMessages.push(message)
    const oneHourAgo = Date.now() - 3600000
    const filteredMessages = userMessages.filter((msg) => msg.createdTimestamp > oneHourAgo)
    this.userMessages.set(userId, filteredMessages)
  },
  /**
   * @param {GuildMember} member 
   * @param {Client} client
   * @param {string} specificReason 
   */
  async punishMember(member, client, specificReason = null) {
    try {
      if (!antiSpamConfig.punishment) return
      const punishmentType = antiSpamConfig.punishment.type
      const reason = specificReason || antiSpamConfig.punishment.reason || "Violation of server rules"
      if (punishmentType === "mute") {
        const muteDurationMs = antiSpamConfig.punishment.muteDuration * 60 * 1000
        await member.timeout(muteDurationMs, reason)
        console.log(
          `Muted member ${member.user.tag} for ${antiSpamConfig.punishment.muteDuration} minutes due to ${reason}`,
        )
      } else if (punishmentType === "kick") {
        await member.kick(reason)
        console.log(`Kicked member ${member.user.tag} due to ${reason}`)
      }
    } catch (error) {
      console.error(`Error punishing member ${member.user.tag}:`, error)
    }
  },
  /**
   * @param {Message} message 
   * @param {Client} client 
   * @param {number} messageCount 
   * @param {string} type 
   */
  async logSpam(message, client, messageCount, type = "Spam") {
    try {
      if (!antiSpamConfig.logging || !antiSpamConfig.logging.enabled || !antiSpamConfig.logging.channelId) {
        console.log("Spam logging is disabled or no log channel configured")
        return
      }
      console.log(`Attempting to log ${type.toLowerCase()} to channel ID: ${antiSpamConfig.logging.channelId}`)
      const logChannel = await client.channels.fetch(antiSpamConfig.logging.channelId).catch((err) => {
        console.error(`Error fetching log channel: ${err}`)
        return null
      })
      if (!logChannel) {
        console.error(`Log channel ${antiSpamConfig.logging.channelId} not found`)
        return
      }
      console.log(`Found log channel: ${logChannel.name}`)
      const embed = new EmbedBuilder()
        .setColor(antiSpamConfig.embed.color)
        .setTitle(`${type} detected`)
        .setDescription(`A user has violated the rules.`)
        .addFields(
          { name: "User", value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
          { name: "Type", value: type, inline: true },
        )
        .setTimestamp()
      if (type === "Spam") {
        embed.addFields({
          name: "Details",
          value: `${messageCount} messages in ${antiSpamConfig.timeWindow} seconds`,
          inline: false,
        })
      }
      embed.addFields({
        name: "Actions",
        value: `${
          antiSpamConfig.punishment?.enabled
            ? antiSpamConfig.punishment.type === "mute"
              ? "Timeout for " + antiSpamConfig.punishment.muteDuration + " minutes"
              : "Kick"
            : "No punishment"
        }`,
        inline: false,
      })
      embed.addFields({
        name: "Message Content",
        value:
          message.content.length > 1024
            ? message.content.substring(0, 1021) + "..."
            : message.content || "[No text message]",
        inline: false,
      })
      try {
        await logChannel.send({ embeds: [embed] })
        console.log(`${type} log message sent successfully`)
      } catch (err) {
        console.error(`Error sending log message: ${err}`)
      }
    } catch (error) {
      console.error(`Error logging ${type.toLowerCase()}:`, error)
    }
  },
}