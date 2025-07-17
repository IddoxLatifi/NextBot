const fs = require('fs')
const path = require('path')
const { EmbedBuilder } = require('discord.js')
const autoReactModule = require('./autoReact')
const DATA_PATH = path.join(__dirname, '../../data/stickymessages.json')
function loadData() {
  if (!fs.existsSync(DATA_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  } catch {
    return {}
  }
}
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}
let stickyData = loadData()
const stickyMessageIds = new Map()
for (const channelId in stickyData) {
  if (stickyData[channelId].messageId) {
    stickyMessageIds.set(channelId, stickyData[channelId].messageId)
  }
}
module.exports = {
  setSticky(channelId, embedData) {
    stickyData[channelId] = { embedData, messageId: null }
    saveData(stickyData)
    stickyMessageIds.set(channelId, null)
  },
  removeSticky(channelId) {
    delete stickyData[channelId]
    saveData(stickyData)
    stickyMessageIds.delete(channelId)
  },
  getSticky(channelId) {
    return stickyData[channelId] || null
  },
  async resendSticky(channel, client) {
    const sticky = stickyData[channel.id]
    if (!sticky) return
    const lastStickyId = stickyMessageIds.get(channel.id)
    if (lastStickyId) {
      try {
        const oldMsg = await channel.messages.fetch(lastStickyId)
        if (oldMsg) await oldMsg.delete().catch(() => {})
      } catch {}
    }
    const embed = EmbedBuilder.from(sticky.embedData)
    const sent = await channel.send({ embeds: [embed] })
    sticky.messageId = sent.id
    stickyMessageIds.set(channel.id, sent.id)
    saveData(stickyData)
    await autoReactModule.handleMessage(sent, client, true)
  },
  async handleMessage(message, client) {
    if (!stickyData[message.channel.id]) return
    await this.resendSticky(message.channel, client)
  },
} 