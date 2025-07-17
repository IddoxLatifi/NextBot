const FileStorage = require("../utils/fileStorage")
let autoReactConfig = { channels: {}, users: {}, keywords: {} }
const DATA_FILENAME = "autoReact"
async function loadConfig() {
  try {
    const loadedConfig = await FileStorage.loadData(DATA_FILENAME, { channels: {}, users: {}, keywords: {} })
    autoReactConfig = {
      channels: loadedConfig.channels || {},
      users: loadedConfig.users || {},
      keywords: loadedConfig.keywords || {}
    }
    console.log("AutoReact config loaded:", autoReactConfig)
  } catch (error) {
    console.error("Error loading AutoReact config:", error)
    autoReactConfig = { channels: {}, users: {}, keywords: {} }
  }
}
async function saveConfig() {
  try {
    await FileStorage.saveData(DATA_FILENAME, autoReactConfig)
    console.log("AutoReact config saved")
  } catch (error) {
    console.error("Error saving AutoReact config:", error)
  }
}
loadConfig()
module.exports = {
  name: "autoReact",
  /**
   * @param {import('discord.js').Client} client
   */
  async init(client) {
    console.log("Auto React module initialized")
    await loadConfig()
  },
  /**
   * @param {import('discord.js').Message} message
   * @param {import('discord.js').Client} client
   * @param {boolean} allowBotMessages
   */
  async handleMessage(message, client, allowBotMessages = false) {
    if (message.author.bot && !allowBotMessages) return
    try {
      const channelReactions = autoReactConfig.channels[message.channel.id]
      if (channelReactions && channelReactions.length > 0) {
        for (const emoji of channelReactions) {
          await this.reactWithEmoji(message, emoji, client)
        }
      }
      if (!message.author.bot || allowBotMessages) {
        const userReactions = autoReactConfig.users[message.author.id]
        if (userReactions && userReactions.length > 0) {
          for (const emoji of userReactions) {
            await this.reactWithEmoji(message, emoji, client)
          }
        }
        if (message.content) {
          const content = message.content.toLowerCase()
          for (const [keyword, emojis] of Object.entries(autoReactConfig.keywords)) {
            if (content.includes(keyword.toLowerCase())) {
              for (const emoji of emojis) {
                await this.reactWithEmoji(message, emoji, client)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in auto react:", error)
    }
  },
  /**
   * @param {import('discord.js').Message} message
   * @param {string} emoji
   * @param {import('discord.js').Client} client
   */
  async reactWithEmoji(message, emoji, client) {
    try {
      if (emoji.startsWith("<") && emoji.endsWith(">")) {
        const emojiMatch = emoji.match(/<(a)?:([a-zA-Z0-9_]+):(\d+)>/)
        if (emojiMatch) {
          const isAnimated = emojiMatch[1] === "a"
          const emojiName = emojiMatch[2]
          const emojiId = emojiMatch[3]
          try {
            await message.react(emojiId)
          } catch (error) {
            if (error.code === 10014) {
              console.log(`Emoji ${emojiName} not found, trying to import it...`)
              try {
                const emojiModule = require("./emojiManager")
                const importedEmoji = await emojiModule.importEmoji(
                  message.guild,
                  emojiName,
                  `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}`,
                  isAnimated,
                )
                if (importedEmoji) {
                  await message.react(importedEmoji.id)
                  console.log(`Successfully reacted with imported emoji ${emojiName}`)
                }
              } catch (importError) {
                console.error(`Error importing emoji ${emojiName}:`, importError)
              }
            } else {
              throw error
            }
          }
        }
      } else {
        try {
          await message.react(emoji)
        } catch (error) {
          if (error.code === 10014) {
            const guildEmoji = message.guild.emojis.cache.find(e => e.name === emoji)
            if (guildEmoji) {
              await message.react(guildEmoji)
            } else {
              console.error(`Emoji ${emoji} not found in server`)
            }
          } else {
            throw error
          }
        }
      }
    } catch (error) {
      console.error(`Error reacting with emoji ${emoji}:`, error)
    }
  },
  /**
   * @param {string} channelId
   * @param {string} emoji
   * @returns {boolean}
   */
  async addChannelReaction(channelId, emoji) {
    try {
      if (!autoReactConfig || !autoReactConfig.channels) {
        await loadConfig()
      }
      if (!autoReactConfig.channels[channelId]) {
        autoReactConfig.channels[channelId] = []
      }
      if (!autoReactConfig.channels[channelId].includes(emoji)) {
        autoReactConfig.channels[channelId].push(emoji)
        await saveConfig()
      }
      return true
    } catch (error) {
      console.error("Error adding channel reaction:", error)
      return false
    }
  },
  /**
   * @param {string} channelId
   * @param {string} emoji
   * @returns {boolean}
   */
  async removeChannelReaction(channelId, emoji) {
    try {
      if (!autoReactConfig || !autoReactConfig.channels) {
        await loadConfig()
      }
      if (autoReactConfig.channels[channelId]) {
        const index = autoReactConfig.channels[channelId].indexOf(emoji)
        if (index !== -1) {
          autoReactConfig.channels[channelId].splice(index, 1)
          if (autoReactConfig.channels[channelId].length === 0) {
            delete autoReactConfig.channels[channelId]
          }
          await saveConfig()
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Error removing channel reaction:", error)
      return false
    }
  },
  /**
   * @param {string} userId
   * @param {string} emoji
   * @returns {boolean}
   */
  async addUserReaction(userId, emoji) {
    try {
      if (!autoReactConfig || !autoReactConfig.users) {
        await loadConfig()
      }
      if (!autoReactConfig.users[userId]) {
        autoReactConfig.users[userId] = []
      }
      if (!autoReactConfig.users[userId].includes(emoji)) {
        autoReactConfig.users[userId].push(emoji)
        await saveConfig()
      }
      return true
    } catch (error) {
      console.error("Error adding user reaction:", error)
      return false
    }
  },
  /**
   * @param {string} userId
   * @param {string} emoji
   * @returns {boolean}
   */
  async removeUserReaction(userId, emoji) {
    try {
      if (!autoReactConfig || !autoReactConfig.users) {
        await loadConfig()
      }
      if (autoReactConfig.users[userId]) {
        const index = autoReactConfig.users[userId].indexOf(emoji)
        if (index !== -1) {
          autoReactConfig.users[userId].splice(index, 1)
          if (autoReactConfig.users[userId].length === 0) {
            delete autoReactConfig.users[userId]
          }
          await saveConfig()
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Error removing user reaction:", error)
      return false
    }
  },
  /**
   * @param {string} keyword
   * @param {string} emoji
   * @returns {boolean}
   */
  async addKeywordReaction(keyword, emoji) {
    try {
      if (!autoReactConfig || !autoReactConfig.keywords) {
        await loadConfig()
      }
      if (!autoReactConfig.keywords[keyword]) {
        autoReactConfig.keywords[keyword] = []
      }
      if (!autoReactConfig.keywords[keyword].includes(emoji)) {
        autoReactConfig.keywords[keyword].push(emoji)
        await saveConfig()
      }
      return true
    } catch (error) {
      console.error("Error adding keyword reaction:", error)
      return false
    }
  },
  /**
   * @param {string} keyword
   * @param {string} emoji
   * @returns {boolean}
   */
  async removeKeywordReaction(keyword, emoji) {
    try {
      if (!autoReactConfig || !autoReactConfig.keywords) {
        await loadConfig()
      }
      if (autoReactConfig.keywords[keyword]) {
        const index = autoReactConfig.keywords[keyword].indexOf(emoji)
        if (index !== -1) {
          autoReactConfig.keywords[keyword].splice(index, 1)
          if (autoReactConfig.keywords[keyword].length === 0) {
            delete autoReactConfig.keywords[keyword]
          }
          await saveConfig()
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Error removing keyword reaction:", error)
      return false
    }
  },
  /**
   * @param {string} channelId
   * @returns {string[]}
   */
  getChannelReactions(channelId) {
    return autoReactConfig.channels[channelId] || []
  },
  /**
   * @param {string} userId
   * @returns {string[]}
   */
  getUserReactions(userId) {
    return autoReactConfig.users[userId] || []
  },
  /**
   * @param {string} keyword
   * @returns {string[]}
   */
  getKeywordReactions(keyword) {
    return autoReactConfig.keywords[keyword] || []
  },
  /**
   * @returns {Object}
   */
  getConfig() {
    if (!autoReactConfig || !autoReactConfig.channels || !autoReactConfig.users || !autoReactConfig.keywords) {
      loadConfig().catch(console.error)
      return { channels: {}, users: {}, keywords: {} }
    }
    return autoReactConfig
  },
  async reloadConfig() {
    await loadConfig()
  },
}