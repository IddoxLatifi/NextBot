const { EmbedBuilder } = require("discord.js")
const fetch = require("node-fetch")
module.exports = {
  /**
   * @param {import('discord.js').Guild} guild 
   * @param {string} name 
   * @param {string} url 
   * @param {boolean} animated 
   * @returns {Promise<import('discord.js').GuildEmoji|null>} 
   */
  async importEmoji(guild, name, url, animated = false) {
    try {
      const existingEmoji = guild.emojis.cache.find((emoji) => emoji.name.toLowerCase() === name.toLowerCase())
      if (existingEmoji) {
        console.log(`Emoji ${name} already exists in the server`)
        return existingEmoji
      }
      const getEmojiLimit = (premiumTier) => {
        switch (premiumTier) {
          case 1:
            return 100 
          case 2:
            return 150 
          case 3:
            return 250 
          default:
            return 50 
        }
      }
      const emojiLimit = getEmojiLimit(guild.premiumTier)
      const currentAnimatedEmojis = guild.emojis.cache.filter((emoji) => emoji.animated).size
      const currentStaticEmojis = guild.emojis.cache.filter((emoji) => !emoji.animated).size
      if (animated && currentAnimatedEmojis >= emojiLimit) {
        console.error(`Server has reached the limit for animated emojis (${currentAnimatedEmojis}/${emojiLimit})`)
        return null
      } else if (!animated && currentStaticEmojis >= emojiLimit) {
        console.error(`Server has reached the limit for static emojis (${currentStaticEmojis}/${emojiLimit})`)
        return null
      }
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error downloading the emoji image: ${response.statusText}`)
      }
      const buffer = await response.buffer()
      const emoji = await guild.emojis.create({
        attachment: buffer,
        name: name,
      })
      console.log(`Emoji ${name} successfully added to the server`)
      return emoji
    } catch (error) {
      console.error(`Error importing emoji ${name}:`, error)
      return null
    }
  },
  /**
   * @param {string} emojiString 
   * @returns {Object|null}
   */
  parseEmojiString(emojiString) {
    if (!emojiString) return null
    const customEmojiMatch = emojiString.match(/<(a)?:([a-zA-Z0-9_]+):(\d+)>/)
    if (customEmojiMatch) {
      return {
        isCustom: true,
        isAnimated: customEmojiMatch[1] === "a",
        name: customEmojiMatch[2],
        id: customEmojiMatch[3],
        url: `https://cdn.discordapp.com/emojis/${customEmojiMatch[3]}.${customEmojiMatch[1] === "a" ? "gif" : "png"}`,
      }
    }
    return {
      isCustom: false,
      name: emojiString,
      isAnimated: false,
      id: null,
      url: null,
    }
  },
}