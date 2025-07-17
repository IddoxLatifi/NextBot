const { AuditLogEvent, ChannelType } = require('discord.js')
const FileStorage = require('../utils/fileStorage')
const EmbedBuilderUtil = require('../utils/embedBuilder')
const guildlogConfigFile = require('../config/guildlog')
let guildLogConfig = { channelId: null }
async function loadConfig() {
  guildLogConfig.channelId = guildlogConfigFile.channelId || null
  const stored = await FileStorage.loadData('guildlog_config', {})
  if (stored && stored.channelId) {
    guildLogConfig.channelId = stored.channelId
  }
}
async function saveConfig() {
  await FileStorage.saveData('guildlog_config', guildLogConfig)
}
async function sendLog(client, guild, embed) {
  if (!guildLogConfig.channelId) return
  const channel = await guild.channels.fetch(guildLogConfig.channelId).catch(() => null)
  if (!channel || !channel.isTextBased()) return
  await channel.send({ embeds: [embed] })
}
async function fetchExecutor(guild, type, targetId) {
  const audit = await guild.fetchAuditLogs({ type, limit: 5 }).catch(() => null)
  if (!audit || audit.entries.size === 0) return null
  const entry = audit.entries.find(e => e.target && e.target.id === targetId)
  if (!entry) return null
  if (Date.now() - entry.createdTimestamp > 5000) return null
  return entry.executor
}
function getLogColor(type) {
  return (
    (type === 'create' && guildlogConfigFile.colorCreate) ||
    (type === 'delete' && guildlogConfigFile.colorDelete) ||
    (type === 'update' && guildlogConfigFile.colorUpdate) ||
    (type === 'role' && guildlogConfigFile.colorRole) ||
    (type === 'mute' && guildlogConfigFile.colorMute) ||
    (type === 'ban' && guildlogConfigFile.colorBan) ||
    (type === 'kick' && guildlogConfigFile.colorKick) ||
    guildlogConfigFile.colorDefault
  )
}
function buildLogEmbedV2({
  type, 
  emoji,
  title,
  executor,
  executorId,
  target,
  targetId,
  targetType, 
  oldValue,
  newValue,
  color,
  footerText,
  footerIconUrl,
  showTimestamp = true,
}) {
  const embedColor = color || getLogColor(type)
  let fields = []
  if (executor && executorId) {
    fields.push({
      name: '🛡️ Performed by',
      value: `**${executor}**\n${executorId}`,
      inline: true,
    })
  }
  let valueField = `**${target}**\n${targetId}`
  if (oldValue !== undefined && oldValue !== null && oldValue !== '') {
    valueField += `\nBefore: \`${oldValue}\``
  }
  if (newValue !== undefined && newValue !== null && newValue !== '') {
    valueField += `\nAfter: \`${newValue}\``
  }
  if (targetType === 'channel' && target && targetId) {
    fields.push({
      name: '➡️ Target: Channel',
      value: valueField,
      inline: true,
    })
  } else if (targetType === 'member' && target && targetId) {
    fields.push({
      name: '➡️ Target: Member',
      value: valueField,
      inline: true,
    })
  } else if (targetType === 'role' && target && targetId) {
    fields.push({
      name: '➡️ Target: Role',
      value: valueField,
      inline: true,
    })
  }
  const embed = EmbedBuilderUtil.create({
    title: `${emoji || ''} ${title}`,
    color: embedColor,
    footer: footerText || '',
    footerIcon: footerIconUrl,
  })
  embed.addFields(fields)
  if (showTimestamp) embed.setTimestamp()
  return embed
}
module.exports = {
  name: 'guildLogger',
  async init(client) {
    await loadConfig()
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      if (!guildLogConfig.channelId) return
      const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id))
      const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id))
      if (addedRoles.size > 0) {
        for (const [roleId, role] of addedRoles) {
          const executor = await fetchExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id)
          const executorId = executor ? executor.id : 'Unknown'
          const embed = buildLogEmbedV2({
            type: 'role',
            emoji: '🎖️',
            title: 'Role granted',
            executor: executor ? `<@${executor.id}>` : 'Unknown',
            executorId,
            target: `<@&${roleId}>`,
            targetId: roleId,
            targetType: 'role',
            newValue: `<@&${roleId}>`,
            color: guildlogConfigFile.color,
            footerText: guildlogConfigFile.footerText,
            footerIconUrl: guildlogConfigFile.footerIconUrl,
            showTimestamp: guildlogConfigFile.showTimestamp,
          })
          await sendLog(client, newMember.guild, embed)
        }
      }
      if (removedRoles.size > 0) {
        for (const [roleId, role] of removedRoles) {
          const executor = await fetchExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id)
          const executorId = executor ? executor.id : 'Unknown'
          const embed = buildLogEmbedV2({
            type: 'role',
            emoji: '🎖️',
            title: 'Role removed',
            executor: executor ? `<@${executor.id}>` : 'Unknown',
            executorId,
            target: `<@&${roleId}>`,
            targetId: roleId,
            targetType: 'role',
            oldValue: `<@&${roleId}>`,
            color: guildlogConfigFile.color,
            footerText: guildlogConfigFile.footerText,
            footerIconUrl: guildlogConfigFile.footerIconUrl,
            showTimestamp: guildlogConfigFile.showTimestamp,
          })
          await sendLog(client, newMember.guild, embed)
        }
      }
      if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
        const executor = await fetchExecutor(newMember.guild, AuditLogEvent.MemberUpdate, newMember.id)
        const executorId = executor ? executor.id : 'Unknown'
        if (newMember.isCommunicationDisabled()) {
          const embed = buildLogEmbedV2({
            type: 'mute',
            emoji: '🔇',
            title: 'Member muted',
            executor: executor ? `<@${executor.id}>` : 'Unknown',
            executorId,
            target: `<@${newMember.id}>`,
            targetId: newMember.id,
            targetType: 'member',
            newValue: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp/1000)}:R>`,
            color: guildlogConfigFile.color,
            footerText: guildlogConfigFile.footerText,
            footerIconUrl: guildlogConfigFile.footerIconUrl,
            showTimestamp: guildlogConfigFile.showTimestamp,
          })
          await sendLog(client, newMember.guild, embed)
        } else {
          const embed = buildLogEmbedV2({
            type: 'mute',
            emoji: '🔇',
            title: 'Mute removed',
            executor: executor ? `<@${executor.id}>` : 'Unknown',
            executorId,
            target: `<@${newMember.id}>`,
            targetId: newMember.id,
            targetType: 'member',
            oldValue: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp/1000)}:R>`,
            color: guildlogConfigFile.color,
            footerText: guildlogConfigFile.footerText,
            footerIconUrl: guildlogConfigFile.footerIconUrl,
            showTimestamp: guildlogConfigFile.showTimestamp,
          })
          await sendLog(client, newMember.guild, embed)
        }
      }
    })
    client.on('guildBanAdd', async (ban) => {
      if (!guildLogConfig.channelId) return
      const executor = await fetchExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id)
      const executorId = executor ? executor.id : 'Unknown'
      const embed = buildLogEmbedV2({
        type: 'ban',
        emoji: '🚫',
        title: 'Member banned',
        executor: executor ? `<@${executor.id}>` : 'Unknown',
        executorId,
        target: `<@${ban.user.id}>`,
        targetId: ban.user.id,
        targetType: 'member',
        color: guildlogConfigFile.color,
        footerText: guildlogConfigFile.footerText,
        footerIconUrl: guildlogConfigFile.footerIconUrl,
        showTimestamp: guildlogConfigFile.showTimestamp,
      })
      await sendLog(client, ban.guild, embed)
    })
    client.on('guildBanRemove', async (ban) => {
      if (!guildLogConfig.channelId) return
      const executor = await fetchExecutor(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id)
      const executorId = executor ? executor.id : 'Unknown'
      const embed = buildLogEmbedV2({
        type: 'ban',
        emoji: '🚫',
        title: 'Ban removed',
        executor: executor ? `<@${executor.id}>` : 'Unknown',
        executorId,
        target: `<@${ban.user.id}>`,
        targetId: ban.user.id,
        targetType: 'member',
        color: guildlogConfigFile.color,
        footerText: guildlogConfigFile.footerText,
        footerIconUrl: guildlogConfigFile.footerIconUrl,
        showTimestamp: guildlogConfigFile.showTimestamp,
      })
      await sendLog(client, ban.guild, embed)
    })
    client.on('channelCreate', async (channel) => {
      if (!guildLogConfig.channelId) return
      if (channel.type === ChannelType.DM) return
      const executorObj = await fetchExecutor(channel.guild, AuditLogEvent.ChannelCreate, channel.id)
      const executorMention = executorObj ? `<@${executorObj.id}>` : 'Unknown'
      const executorId = executorObj ? executorObj.id : 'Unknown'
      const embed = buildLogEmbedV2({
        type: 'create',
        emoji: '➕',
        title: 'Channel created',
        executor: executorMention,
        executorId,
        target: `<#${channel.id}>`,
        targetId: channel.id,
        targetType: 'channel',
        color: guildlogConfigFile.color,
        footerText: guildlogConfigFile.footerText,
        footerIconUrl: guildlogConfigFile.footerIconUrl,
        showTimestamp: guildlogConfigFile.showTimestamp,
      })
      await sendLog(client, channel.guild, embed)
    })
    client.on('channelDelete', async (channel) => {
      if (!guildLogConfig.channelId) return
      if (channel.type === ChannelType.DM) return
      const executor = await fetchExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id)
      const executorId = executor ? executor.id : 'Unknown'
      const embed = buildLogEmbedV2({
        type: 'delete',
        emoji: '🗑️',
        title: 'Channel deleted',
        executor: executor ? `<@${executor.id}>` : 'Unknown',
        executorId,
        target: `#${channel.name}`,
        targetId: channel.id,
        targetType: 'channel',
        oldValue: channel.name,
        color: guildlogConfigFile.color,
        footerText: guildlogConfigFile.footerText,
        footerIconUrl: guildlogConfigFile.footerIconUrl,
        showTimestamp: guildlogConfigFile.showTimestamp,
      })
      await sendLog(client, channel.guild, embed)
    })
    client.on('channelUpdate', async (oldChannel, newChannel) => {
      if (!guildLogConfig.channelId) return
      if (oldChannel.type === ChannelType.DM || newChannel.type === ChannelType.DM) return
      if (oldChannel.name !== newChannel.name) {
        const executor = await fetchExecutor(newChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id)
        const executorId = executor ? executor.id : 'Unknown'
        const embed = buildLogEmbedV2({
          type: 'update',
          emoji: '✏️',
          title: 'Channel renamed',
          executor: executor ? `<@${executor.id}>` : 'Unknown',
          executorId,
          target: `<#${newChannel.id}>`,
          targetId: newChannel.id,
          targetType: 'channel',
          oldValue: oldChannel.name,
          newValue: newChannel.name,
          color: guildlogConfigFile.color,
          footerText: guildlogConfigFile.footerText,
          footerIconUrl: guildlogConfigFile.footerIconUrl,
          showTimestamp: guildlogConfigFile.showTimestamp,
        })
        await sendLog(client, newChannel.guild, embed)
      }
    })
    client.on('guildMemberRemove', async (member) => {
      if (!guildLogConfig.channelId) return
      const audit = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 }).catch(() => null)
      if (audit && audit.entries.size > 0) {
        const entry = audit.entries.first()
        if (entry.target.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
          const executor = await fetchExecutor(member.guild, AuditLogEvent.MemberKick, member.id)
          const executorId = executor ? executor.id : 'Unknown'
          const embed = buildLogEmbedV2({
            type: 'kick',
            emoji: '👋',
            title: 'Member kicked',
            executor: executor ? `<@${executor.id}>` : 'Unknown',
            executorId,
            target: `<@${member.id}>`,
            targetId: member.id,
            targetType: 'member',
            color: guildlogConfigFile.color,
            footerText: guildlogConfigFile.footerText,
            footerIconUrl: guildlogConfigFile.footerIconUrl,
            showTimestamp: guildlogConfigFile.showTimestamp,
          })
          await sendLog(client, member.guild, embed)
        }
      }
    })
  },
  async setLogChannel(channelId) {
    guildLogConfig.channelId = channelId
    await saveConfig()
  },
  getLogChannel() {
    return guildLogConfig.channelId
  }
} 