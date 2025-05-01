const { EmbedBuilder } = require("discord.js")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
class EmbedBuilderUtil {
  /**
   * @param {Object} options 
   * @param {string} options.title 
   * @param {string} options.description 
   * @param {string} options.color 
   * @param {string} options.thumbnail
   * @param {string} options.image 
   * @param {string} options.footer 
   * @param {string} options.footerIcon 
   * @returns {EmbedBuilder} 
   */
  static create(options = {}) {
    const embed = new EmbedBuilder()
    if (options.title) embed.setTitle(options.title)
    if (options.description) embed.setDescription(options.description)
    embed.setColor(options.color || "#5865F2")
    if (options.thumbnail) embed.setThumbnail(options.thumbnail)
    if (options.image) embed.setImage(options.image)
    embed.setTimestamp()
    if (options.footer || options.footerIcon || process.env.EMBED_FOOTER_IMAGE_URL) {
      embed.setFooter({
        text: options.footer || "MultiBot | Created by @apt_start_latifi | shop.iddox.tech",
        iconURL: options.footerIcon || process.env.EMBED_FOOTER_IMAGE_URL,
      })
    }
    return embed
  }
  /**
   * @param {string} title
   * @param {string} description 
   * @returns {EmbedBuilder} 
   */
  static success(title, description) {
    return this.create({
      title,
      description,
      color: "#43B581", 
      footer: "Erfolgreich",
    })
  }
  /**
   * @param {string} title 
   * @param {string} description 
   * @returns {EmbedBuilder} 
   */
  static error(title, description) {
    return this.create({
      title,
      description,
      color: "#F04747", 
      footer: "Fehler",
    })
  }

  /**
   * @param {string} title 
   * @param {string} description 
   * @returns {EmbedBuilder}
   */
  static warning(title, description) {
    return this.create({
      title,
      description,
      color: "#FAA61A", 
      footer: "Warnung",
    })
  }
  /**
   * @param {string} title 
   * @param {string} description 
   * @returns {EmbedBuilder} 
   */
  static info(title, description) {
    return this.create({
      title,
      description,
      color: "#5865F2", 
      footer: "Information",
    })
  }
}
module.exports = EmbedBuilderUtil
