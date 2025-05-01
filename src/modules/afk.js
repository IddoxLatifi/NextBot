const { EmbedBuilder } = require("discord.js")
const afkConfig = require("../config/afk")
const MessageUtils = require("../utils/messageUtils")
const fs = require("fs")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
const path = require("path")
const DATA_DIR = path.join(__dirname, "../../data")
const AFK_USERS_DIR = path.join(DATA_DIR, "afk-users")
function ensureDirectoriesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(AFK_USERS_DIR)) {
    fs.mkdirSync(AFK_USERS_DIR, { recursive: true })
  }
}
module.exports = {
  name: "afk",
  /**
   * @param {Client} client
   */
  init(client) {
    ensureDirectoriesExist()
    console.log("AFK module initialized")
  },
  /**
   * @param {Client} client
   */
  async loadAfkUsers(client) {
    try {
      ensureDirectoriesExist()
      const afkFiles = fs.readdirSync(AFK_USERS_DIR).filter((file) => file.endsWith(".json"))
      console.log(`Found ${afkFiles.length} AFK users`)
      for (const file of afkFiles) {
        try {
          const filePath = path.join(AFK_USERS_DIR, file)
          const fileContent = fs.readFileSync(filePath, "utf8")
          const afkData = JSON.parse(fileContent)
          const userId = file.replace(".json", "")
          client.afkUsers.set(userId, afkData)
          console.log(`Loaded AFK user: ${userId}`)
        } catch (err) {
          console.error(`Error loading AFK file ${file}:`, err)
        }
      }
    } catch (error) {
      console.error("Error loading AFK users:", error)
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   * @param {string} reason
   */
  async setAfk(interaction, client, reason) {
    ensureDirectoriesExist()
    const userId = interaction.user.id
    const timestamp = Date.now()
    if (client.afkUsers.has(userId)) {
      return MessageUtils.sendTemporaryMessage(interaction, {
        content: { content: afkConfig.messages.alreadyAfk },
        ephemeral: true,
        deleteAfter: afkConfig.deleteDelay,
      })
    }
    const afkData = {
      reason: reason || afkConfig.defaultReason,
      timestamp,
      username: interaction.user.username,
    }
    client.afkUsers.set(userId, afkData)
    const filePath = path.join(AFK_USERS_DIR, `${userId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(afkData, null, 2))
    const embed = new EmbedBuilder()
      .setColor(afkConfig.embed.set.color)
      .setTitle(afkConfig.embed.set.title)
      .setDescription(afkConfig.embed.set.description.replace("{reason}", reason || afkConfig.defaultReason))
    if (afkConfig.embed.set.showTimestamp) {
      embed.setTimestamp()
    }
    if (afkConfig.embed.set.footer) {
      const iconURL =
        afkConfig.embed.set.footerIconUrl && afkConfig.embed.set.footerIconUrl !== ""
          ? afkConfig.embed.set.footerIconUrl
          : null
      embed.setFooter({
        text: afkConfig.embed.set.footer,
        iconURL: iconURL,
      })
    }
    await interaction.reply({ embeds: [embed], ephemeral: true })
    try {
      if (interaction.member && interaction.member.manageable) {
        const currentNick = interaction.member.nickname || interaction.user.username
        if (!currentNick.startsWith(afkConfig.prefix)) {
          await interaction.member.setNickname(`${afkConfig.prefix}${currentNick.substring(0, 26)}`)
        }
      }
    } catch (error) {
      console.error("Error setting AFK nickname:", error)
    }
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  async removeAfk(message, client) {
    const userId = message.author.id
    client.afkUsers.delete(userId)
    const filePath = path.join(AFK_USERS_DIR, `${userId}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
    const embed = new EmbedBuilder()
      .setColor(afkConfig.embed.remove.color)
      .setDescription(afkConfig.embed.remove.description)
    if (afkConfig.embed.remove.title) {
      embed.setTitle(afkConfig.embed.remove.title)
    }
    if (afkConfig.embed.remove.showTimestamp) {
      embed.setTimestamp()
    }
    if (afkConfig.embed.remove.footer) {
      const iconURL =
        afkConfig.embed.remove.footerIconUrl && afkConfig.embed.remove.footerIconUrl !== ""
          ? afkConfig.embed.remove.footerIconUrl
          : null
      embed.setFooter({
        text: afkConfig.embed.remove.footer,
        iconURL: iconURL,
      })
    }

    // Only send and auto-delete if deleteDelay is greater than 0
    if (afkConfig.deleteDelay > 0) {
      await MessageUtils.sendTemporaryMessage(message, {
        content: { embeds: [embed] },
        deleteAfter: afkConfig.deleteDelay,
      })
    } else {
      await message.channel.send({ embeds: [embed] })
    }

    try {
      if (message.member && message.member.manageable) {
        const currentNick = message.member.nickname
        if (currentNick && currentNick.startsWith(afkConfig.prefix)) {
          await message.member.setNickname(currentNick.substring(afkConfig.prefix.length))
        }
      }
    } catch (error) {
      console.error("Error removing AFK nickname:", error)
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async removeAfkCommand(interaction, client) {
    const userId = interaction.user.id
    if (!client.afkUsers.has(userId)) {
      return MessageUtils.sendTemporaryMessage(interaction, {
        content: { content: afkConfig.messages.notAfk },
        ephemeral: true,
        deleteAfter: afkConfig.deleteDelay,
      })
    }
    client.afkUsers.delete(userId)
    const filePath = path.join(AFK_USERS_DIR, `${userId}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    const embed = new EmbedBuilder()
      .setColor(afkConfig.embed.remove.color)
      .setDescription(afkConfig.embed.remove.description)
    if (afkConfig.embed.remove.title) {
      embed.setTitle(afkConfig.embed.remove.title)
    }
    if (afkConfig.embed.remove.showTimestamp) {
      embed.setTimestamp()
    }
    if (afkConfig.embed.remove.footer) {
      const iconURL =
        afkConfig.embed.remove.footerIconUrl && afkConfig.embed.remove.footerIconUrl !== ""
          ? afkConfig.embed.remove.footerIconUrl
          : null
      embed.setFooter({
        text: afkConfig.embed.remove.footer,
        iconURL: iconURL,
      })
    }
    await interaction.reply({ embeds: [embed], ephemeral: true })
    try {
      if (interaction.member && interaction.member.manageable) {
        const currentNick = interaction.member.nickname
        if (currentNick && currentNick.startsWith(afkConfig.prefix)) {
          await interaction.member.setNickname(currentNick.substring(afkConfig.prefix.length))
        }
      }
    } catch (error) {
      console.error("Error removing AFK nickname:", error)
    }
  },
  /**
   * Handle message for AFK system
   * @param {Message} message - Discord message
   * @param {Client} client - Discord client
   */
  async handleMessage(message, client) {
    if (message.author.bot || message.content.startsWith("/")) return
    if (client.afkUsers.has(message.author.id)) {
      await this.removeAfk(message, client)
    }
    if (message.mentions.users.size > 0) {
      for (const [userId, user] of message.mentions.users) {
        if (client.afkUsers.has(userId)) {
          const afkData = client.afkUsers.get(userId)
          const timeSince = this.getTimeSince(afkData.timestamp)
          const embed = new EmbedBuilder()
            .setColor(afkConfig.embed.mention.color)
            .setDescription(
              afkConfig.embed.mention.description
                .replace("{username}", user.username)
                .replace("{reason}", afkData.reason)
                .replace("{time}", timeSince),
            )
          if (afkConfig.embed.mention.showTimestamp) {
            embed.setTimestamp()
          }
          if (afkConfig.embed.mention.footer) {
            const iconURL =
              afkConfig.embed.mention.footerIconUrl && afkConfig.embed.mention.footerIconUrl !== ""
                ? afkConfig.embed.mention.footerIconUrl
                : null
            embed.setFooter({
              text: afkConfig.embed.mention.footer,
              iconURL: iconURL,
            })
          }

          // Only send and auto-delete if deleteDelay is greater than 0
          if (afkConfig.deleteDelay > 0) {
            await MessageUtils.sendTemporaryMessage(message, {
              content: { embeds: [embed] },
              deleteAfter: afkConfig.deleteDelay,
            })
          } else {
            await message.channel.send({ embeds: [embed] })
          }
        }
      }
    }
  },
  /**
   * Get time since timestamp in human readable format
   * @param {number} timestamp - Timestamp in milliseconds
   * @returns {string} - Human readable time
   */
  getTimeSince(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) {
      return `${seconds} ${seconds === 1 ? "second" : "seconds"}`
    }
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`
    }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `${hours} ${hours === 1 ? "hour" : "hours"}`
    }
    const days = Math.floor(hours / 24)
    return `${days} ${days === 1 ? "day" : "days"}`
  },
}
