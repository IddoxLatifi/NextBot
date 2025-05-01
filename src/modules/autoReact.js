const fs = require("fs")
const path = require("path")
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js")
const CONFIG_PATH = path.resolve(__dirname, "../config/autoReact.js")
let autoReactConfig = { channels: {}, users: {}, keywords: {} }
function loadConfig() {
  try {
    delete require.cache[require.resolve(CONFIG_PATH)]
    const loadedConfig = require(CONFIG_PATH)
    autoReactConfig = {
      channels: loadedConfig.channels || {},
      users: loadedConfig.users || {},
      keywords: loadedConfig.keywords || {},
    }
    console.log("Auto-react config loaded successfully")
  } catch (error) {
    console.error("Error loading autoReact config:", error)
    if (!fs.existsSync(CONFIG_PATH)) {
      saveConfig()
    }
  }
}
function saveConfig() {
  try {
    const configDir = path.dirname(CONFIG_PATH)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    const configContent = `module.exports = {
  // Reactions for specific channels
  channels: ${JSON.stringify(autoReactConfig.channels, null, 2).replace(/"([^"]+)":/g, "$1:")},
  // Reactions for specific users
  users: ${JSON.stringify(autoReactConfig.users, null, 2).replace(/"([^"]+)":/g, "$1:")},
  // Keyword-based reactions
  keywords: ${JSON.stringify(autoReactConfig.keywords, null, 2).replace(/"([^"]+)":/g, "$1:")}
}
`
    fs.writeFileSync(CONFIG_PATH, configContent, "utf8")
    console.log(`Auto-react config saved to ${CONFIG_PATH}`)
    if (!fs.existsSync(CONFIG_PATH)) {
      console.error(`Failed to save config: File not found after write attempt`)
      return false
    }
    return true
  } catch (error) {
    console.error("Error saving autoReact config:", error)
    return false
  }
}
loadConfig()
module.exports = {
  name: "autoReact",
  /**
   * @param {import('discord.js').Client} client
   */
  init(client) {
    console.log("Auto React module initialized")
    loadConfig()
  },
  /**
   * @param {import('discord.js').Message} message
   * @param {import('discord.js').Client} client
   */
  async handleMessage(message, client) {
    if (message.author.bot) return
    try {
      const channelReactions = autoReactConfig.channels[message.channel.id]
      if (channelReactions) {
        for (const emoji of channelReactions) {
          await this.reactWithEmoji(message, emoji, client)
        }
      }
      const userReactions = autoReactConfig.users[message.author.id]
      if (userReactions) {
        for (const emoji of userReactions) {
          await this.reactWithEmoji(message, emoji, client)
        }
      }
      const content = message.content.toLowerCase()
      for (const [keyword, emojis] of Object.entries(autoReactConfig.keywords)) {
        if (content.includes(keyword.toLowerCase())) {
          for (const emoji of emojis) {
            await this.reactWithEmoji(message, emoji, client)
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
        await message.react(emoji)
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
  addChannelReaction(channelId, emoji) {
    try {
      if (!autoReactConfig.channels[channelId]) {
        autoReactConfig.channels[channelId] = []
      }
      if (!autoReactConfig.channels[channelId].includes(emoji)) {
        autoReactConfig.channels[channelId].push(emoji)
        saveConfig()
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
  removeChannelReaction(channelId, emoji) {
    try {
      if (autoReactConfig.channels[channelId]) {
        const index = autoReactConfig.channels[channelId].indexOf(emoji)
        if (index !== -1) {
          autoReactConfig.channels[channelId].splice(index, 1)
          if (autoReactConfig.channels[channelId].length === 0) {
            delete autoReactConfig.channels[channelId]
          }
          saveConfig()
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
  addUserReaction(userId, emoji) {
    try {
      if (!autoReactConfig.users[userId]) {
        autoReactConfig.users[userId] = []
      }
      if (!autoReactConfig.users[userId].includes(emoji)) {
        autoReactConfig.users[userId].push(emoji)
        saveConfig()
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
  removeUserReaction(userId, emoji) {
    try {
      if (autoReactConfig.users[userId]) {
        const index = autoReactConfig.users[userId].indexOf(emoji)
        if (index !== -1) {
          autoReactConfig.users[userId].splice(index, 1)
          if (autoReactConfig.users[userId].length === 0) {
            delete autoReactConfig.users[userId]
          }
          saveConfig()
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
  addKeywordReaction(keyword, emoji) {
    try {
      if (!autoReactConfig.keywords[keyword]) {
        autoReactConfig.keywords[keyword] = []
      }
      if (!autoReactConfig.keywords[keyword].includes(emoji)) {
        autoReactConfig.keywords[keyword].push(emoji)
        saveConfig()
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
  removeKeywordReaction(keyword, emoji) {
    try {
      if (autoReactConfig.keywords[keyword]) {
        const index = autoReactConfig.keywords[keyword].indexOf(emoji)
        if (index !== -1) {
          autoReactConfig.keywords[keyword].splice(index, 1)
          if (autoReactConfig.keywords[keyword].length === 0) {
            delete autoReactConfig.keywords[keyword]
          }
          saveConfig()
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
    return autoReactConfig
  },
  reloadConfig() {
    loadConfig()
  },
}