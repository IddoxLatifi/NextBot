const { EmbedBuilder } = require('discord.js')
const livestatsConfig = require('../config/livestats')
let livestatsInterval = null
let lastMessageId = null
async function fetchStats(guild) {
  await guild.members.fetch()
  const members = guild.members.cache
  const bots = members.filter(m => m.user.bot).size
  const boosts = guild.premiumSubscriptionCount || 0
  const boostlevel = guild.premiumTier ? `Level ${guild.premiumTier}` : "None"
  const channels = guild.channels.cache.filter(c => [0,2,4,5,13].includes(c.type)).size
  const textchannels = guild.channels.cache.filter(c => c.type === 0).size
  const voicechannels = guild.channels.cache.filter(c => c.type === 2).size
  const roles = guild.roles.cache.size
  const emojis = guild.emojis.cache.size
  const banner = guild.bannerURL({ size: 1024 }) || null
  const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`
  const owner = `<@${guild.ownerId}>`
  const time = livestatsConfig.hammertimeFormat.replace('{timestamp}', Math.floor(Date.now() / 1000))
  const invites = (await guild.invites.fetch().catch(() => []))?.size || 0
  const forumchannels = guild.channels.cache.filter(c => c.type === 15).size
  const categories = guild.channels.cache.filter(c => c.type === 4).size
  return {
    members: members.size,
    bots,
    boosts,
    boostlevel,
    channels,
    textchannels,
    voicechannels,
    roles,
    created,
    owner,
    banner,
    emojis,
    time,
    invites,
    forumchannels,
    categories,
  }
}
function buildEmbed(stats, guild) {
  const cfg = livestatsConfig.embed
  const embed = new EmbedBuilder()
    .setColor(cfg.color)
    .setTitle(cfg.title)
    .setDescription(cfg.description)
  if (cfg.showTimestamp) embed.setTimestamp()
  if (cfg.footerText) embed.setFooter({
    text: cfg.footerText.replace('{time}', stats.time),
    iconURL: cfg.footerIconUrl || guild.iconURL(),
  })
  for (const field of cfg.fields) {
    if (!field.enabled) continue
    let value = stats[field.key] !== undefined ? stats[field.key] : 'N/A'
    if (field.key === 'banner' && stats.banner) {
      embed.setImage(stats.banner)
      value = stats.banner
    }
    embed.addFields({ name: field.name, value: String(value), inline: field.inline })
  }
  return embed
}
async function updateLivestats(client) {
  try {
    if (!livestatsConfig.enabled || !livestatsConfig.channelId) return
    const guild = client.guilds.cache.first()
    if (!guild) return
    const channel = await guild.channels.fetch(livestatsConfig.channelId).catch(() => null)
    if (!channel || !channel.isTextBased()) return
    const stats = await fetchStats(guild)
    const embed = buildEmbed(stats, guild)
    let message = null
    if (lastMessageId) {
      message = await channel.messages.fetch(lastMessageId).catch(() => null)
    }
    if (!message) {
      const messages = await channel.messages.fetch({ limit: 10 }).catch(() => null)
      if (messages) {
        message = messages.find(m => m.author.id === client.user.id && m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text && m.embeds[0].footer.text.includes('Created by @apt_start_latifi'))
        if (message) lastMessageId = message.id
      }
    }
    if (message) {
      await message.edit({ embeds: [embed] })
      lastMessageId = message.id
    } else {
      const sent = await channel.send({ embeds: [embed] })
      lastMessageId = sent.id
    }
  } catch (err) {
    console.error('Error updating livestats:', err)
  }
}
module.exports = {
  name: 'livestats',
  /**
   * @param {Client} client
   */
  init(client) {
    if (!livestatsConfig.enabled || !livestatsConfig.channelId) return
    setTimeout(() => updateLivestats(client), 5000) 
    livestatsInterval = setInterval(() => updateLivestats(client), livestatsConfig.updateInterval)
    console.log('Livestats module started.')
  },
  stop() {
    if (livestatsInterval) clearInterval(livestatsInterval)
    livestatsInterval = null
  },
} 