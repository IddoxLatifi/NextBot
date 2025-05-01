const {
  EmbedBuilder,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js")
const fs = require("fs")
const path = require("path")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
const CONFIG_PATH = path.join(__dirname, "../config/inviteTracker.js")
let config
try {
  config = require(CONFIG_PATH)
} catch (error) {
  console.error("Error loading invite tracker config:", error)
  config = {
    embedColors: {
      join: "#4CAF50",
      leave: "#F44336",
      info: "#3498db",
    },
    embedTitles: {
      join: "🎉 A member has joined the server",
      leave: "🚪 A member has left the server",
      info: "📝 Invite Information",
    },
    embed: {
      footer: "",
      footerIconUrl: "",
      showTimestamp: true,
    },
    messages: {
      unknownInvite: "Unknown",
      unknownInviter: "Unknown",
      normalInvite: "Normal Invite",
    },
    cacheRefreshInterval: 60 * 60 * 1000,
    debug: false,
  }
}
module.exports = {
  name: "inviteTracker",
  invites: new Collection(),
  trackingChannelId: null,
  dataPath: path.join(__dirname, "../data/inviteTracker.json"),
  guildInvitesCache: new Collection(),
  memberJoinData: new Collection(), 
  config: config,
  /**
   * @param {Client} client
   */
  async init(client) {
    console.log("Invite Tracker module initialized")
    this.loadData()
    try {
      await this.refreshInvitesCache(client)
    } catch (error) {
      console.error("Error during initial invite cache refresh:", error)
    }
    setInterval(async () => {
      try {
        await this.refreshInvitesCache(client)
      } catch (error) {
        console.error("Error during scheduled invite cache refresh:", error)
      }
    }, this.config.cacheRefreshInterval)
    client.on("guildCreate", async (guild) => {
      try {
        console.log(`Bot joined new guild: ${guild.name} (${guild.id}). Fetching invites...`)
        await this.fetchGuildInvites(guild)
      } catch (error) {
        console.error(`Error fetching invites for new guild ${guild.id}:`, error)
      }
    })
    client.on("inviteCreate", (invite) => {
      if (this.config.debug) console.log(`New invite created: ${invite.code}`)
      if (!this.guildInvitesCache.has(invite.guild.id)) {
        this.guildInvitesCache.set(invite.guild.id, new Collection())
      }
      this.guildInvitesCache.get(invite.guild.id).set(invite.code, invite)
      if (!this.invites.has(invite.guild.id)) {
        this.invites.set(invite.guild.id, new Collection())
      }
      this.invites.get(invite.guild.id).set(invite.code, {
        code: invite.code,
        uses: invite.uses,
        maxUses: invite.maxUses,
        creator: invite.inviter
          ? {
              id: invite.inviter.id,
              tag: invite.inviter.tag,
            }
          : null,
        channel: {
          id: invite.channel.id,
          name: invite.channel.name,
        },
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        activeMembers: [], 
        leftMembers: [],
      })
      this.saveData()
    })
    client.on("inviteDelete", (invite) => {
      if (this.config.debug) console.log(`Invite deleted: ${invite.code}`)

      if (this.guildInvitesCache.has(invite.guild.id)) {
        this.guildInvitesCache.get(invite.guild.id).delete(invite.code)
      }
      if (this.invites.has(invite.guild.id)) {
        this.invites.get(invite.guild.id).delete(invite.code)
        this.saveData()
      }
    })
    client.on("guildMemberAdd", async (member) => {
      if (!this.trackingChannelId) return
      try {
        await new Promise((resolve) => setTimeout(resolve, 2500))
        const newInvites = await member.guild.invites.fetch().catch((err) => {
          console.error(`Error fetching invites for guild ${member.guild.id}:`, err)
          return new Collection()
        })
        const cachedInvites = this.guildInvitesCache.get(member.guild.id) || new Collection()
        let usedInvite = null
        let usedInviteCode = null
        if (this.config.debug) {
          console.log(`Member joined: ${member.user.tag}`)
          console.log(`Cached invites count: ${cachedInvites.size}`)
          console.log(`New invites count: ${newInvites.size}`)
          console.log(
            "Cached invites:",
            [...cachedInvites.values()].map((i) => `${i.code}: ${i.uses} uses`),
          )
          console.log(
            "New invites:",
            [...newInvites.values()].map((i) => `${i.code}: ${i.uses} uses`),
          )
        }
        newInvites.forEach((invite) => {
          const cachedInvite = cachedInvites.get(invite.code)
          if (cachedInvite && invite.uses > cachedInvite.uses) {
            usedInvite = invite
            usedInviteCode = invite.code
            if (this.config.debug) {
              console.log(`Found used invite: ${invite.code} (${cachedInvite.uses} -> ${invite.uses})`)
            }
          }
        })
        if (!usedInvite) {
          newInvites.forEach((invite) => {
            if (!cachedInvites.has(invite.code) && invite.uses > 0) {
              usedInvite = invite
              usedInviteCode = invite.code
              if (this.config.debug) {
                console.log(`Found new invite with uses: ${invite.code} (${invite.uses} uses)`)
              }
            }
          })
        }
        if (!usedInvite) {
          newInvites.forEach((invite) => {
            if (invite.uses > 0) {
              usedInvite = invite
              usedInviteCode = invite.code
              if (this.config.debug) {
                console.log(`Found any invite with uses: ${invite.code} (${invite.uses} uses)`)
              }
            }
          })
        }
        this.guildInvitesCache.set(member.guild.id, new Collection(newInvites.map((invite) => [invite.code, invite])))
        const channel = await client.channels.fetch(this.trackingChannelId).catch(() => null)
        if (!channel) return
        if (!usedInvite) {
          const embed = new EmbedBuilder()
            .setColor(this.config.embedColors.join)
            .setTitle(this.config.embedTitles.join)
            .setDescription(
              `**Member**\n<@${member.user.id}> ${member.user.tag} (${member.user.id})\n` +
                `Joined at: ${new Date().toLocaleString()}\n\n` +
                `**Invite**\nInvite code: ${this.config.messages.unknownInvite}\n` +
                `Invited by: ${this.config.messages.unknownInviter}`,
            )
          if (this.config.embed.showTimestamp) {
            embed.setTimestamp()
          }
          if (this.config.embed.footer) {
            embed.setFooter({
              text: this.config.embed.footer,
              iconURL: this.config.embed.footerIconUrl,
            })
          }
          await channel.send({ embeds: [embed] })
          return
        }
        if (!this.invites.has(member.guild.id)) {
          this.invites.set(member.guild.id, new Collection())
        }
        let inviteData = this.invites.get(member.guild.id).get(usedInvite.code)
        if (!inviteData) {
          inviteData = {
            code: usedInvite.code,
            uses: usedInvite.uses,
            maxUses: usedInvite.maxUses,
            creator: usedInvite.inviter
              ? {
                  id: usedInvite.inviter.id,
                  tag: usedInvite.inviter.tag,
                }
              : null,
            channel: {
              id: usedInvite.channel.id,
              name: usedInvite.channel.name,
            },
            createdAt: usedInvite.createdAt,
            expiresAt: usedInvite.expiresAt,
            activeMembers: [],
            leftMembers: [],
          }
        }
        if (!inviteData.activeMembers) {
          inviteData.activeMembers = []
        }
        if (!inviteData.leftMembers) {
          inviteData.leftMembers = []
        }
        inviteData.activeMembers.push({
          id: member.user.id,
          tag: member.user.tag,
          joinedAt: Date.now(),
        })
        inviteData.uses = usedInvite.uses
        this.invites.get(member.guild.id).set(usedInvite.code, inviteData)
        this.memberJoinData.set(`${member.guild.id}-${member.user.id}`, {
          inviteCode: usedInvite.code,
          inviterId: usedInvite.inviter ? usedInvite.inviter.id : null,
          joinedAt: Date.now(),
        })
        this.saveData()
        let activeInvitesCount = 0
        let totalUses = 0
        const activeCount = inviteData.activeMembers ? inviteData.activeMembers.length : 0
        const leftCount = inviteData.leftMembers ? inviteData.leftMembers.length : 0
        if (usedInvite.inviter) {
          const guildInvites = this.invites.get(member.guild.id)
          if (guildInvites) {
            guildInvites.forEach((invite) => {
              if (invite.creator && invite.creator.id === usedInvite.inviter.id) {
                activeInvitesCount++
                totalUses += invite.uses
              }
            })
          }
        }
        const embed = new EmbedBuilder()
          .setColor(this.config.embedColors.join)
          .setTitle(this.config.embedTitles.join)
          .setDescription(
            `**Member**\n<@${member.user.id}> ${member.user.tag} (${member.user.id})\n` +
              `Joined at: ${new Date().toLocaleString()}\n\n` +
              `**Invite**\nInvite code: ${usedInvite.code}\n` +
              `Channel: <#${usedInvite.channel.id}> ${usedInvite.channel.name}\n` +
              `Created at: <t:${Math.floor(usedInvite.createdTimestamp / 1000)}:F>\n` +
              `Invited by: ${usedInvite.inviter ? `<@${usedInvite.inviter.id}> (${activeCount}/${usedInvite.uses} active invites)` : this.config.messages.unknownInviter}\n` +
              `Uses: ${usedInvite.uses}`,
          )
        if (this.config.embed.showTimestamp) {
          embed.setTimestamp()
        }
        if (this.config.embed.footer) {
          embed.setFooter({
            text: this.config.embed.footer,
            iconURL: this.config.embed.footerIconUrl,
          })
        }
        await channel.send({ embeds: [embed] })
      } catch (error) {
        console.error(`Error tracking invite for new member in guild ${member.guild.id}:`, error)
        try {
          const channel = await client.channels.fetch(this.trackingChannelId).catch(() => null)
          if (channel) {
            const embed = new EmbedBuilder()
              .setColor(this.config.embedColors.join)
              .setTitle(this.config.embedTitles.join)
              .setDescription(
                `**Member**\n<@${member.user.id}> ${member.user.tag} (${member.user.id})\n` +
                  `Joined at: ${new Date().toLocaleString()}\n\n` +
                  `**Invite**\nInvite code: Error retrieving\nInvited by: ${this.config.messages.unknownInviter}`,
              )
            if (this.config.embed.showTimestamp) {
              embed.setTimestamp()
            }
            if (this.config.embed.footer) {
              embed.setFooter({
                text: this.config.embed.footer,
                iconURL: this.config.embed.footerIconUrl,
              })
            }
            await channel.send({ embeds: [embed] })
          }
        } catch (err) {
          console.error("Error sending fallback join message:", err)
        }
      }
    })
    client.on("guildMemberRemove", async (member) => {
      if (!this.trackingChannelId) return
      try {
        const memberData = this.memberJoinData.get(`${member.guild.id}-${member.user.id}`)
        let inviteInfo = this.config.messages.normalInvite
        let inviteCode = null
        let inviterId = null
        if (memberData) {
          inviteCode = memberData.inviteCode
          inviterId = memberData.inviterId
          if (this.invites.has(member.guild.id)) {
            const guildInvites = this.invites.get(member.guild.id)
            if (guildInvites.has(inviteCode)) {
              const inviteData = guildInvites.get(inviteCode)
              if (inviteData.activeMembers) {
                const index = inviteData.activeMembers.findIndex((m) => m.id === member.user.id)
                if (index !== -1) {
                  const memberInfo = inviteData.activeMembers.splice(index, 1)[0]
                  if (!inviteData.leftMembers) {
                    inviteData.leftMembers = []
                  }
                  inviteData.leftMembers.push({
                    id: memberInfo.id,
                    tag: memberInfo.tag,
                    joinedAt: memberInfo.joinedAt,
                    leftAt: Date.now(),
                  })
                  guildInvites.set(inviteCode, inviteData)
                  this.saveData()
                }
              }
            }
          }
          inviteInfo = `Invite Code: \`${inviteCode}\`\nInvited by: ${inviterId ? `<@${inviterId}>` : "Unknown"}`
        }
        const channel = await client.channels.fetch(this.trackingChannelId).catch(() => null)
        if (!channel) return
        const embed = new EmbedBuilder()
          .setColor(this.config.embedColors.leave)
          .setTitle(this.config.embedTitles.leave)
          .setDescription(
            `**Member**\n<@${member.user.id}> ${member.user.tag} (${member.user.id})\n` +
              `Joined at: <t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n` +
              `Left at: <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
              `**Invite Information**\n${inviteInfo}`,
          )
        if (this.config.embed.showTimestamp) {
          embed.setTimestamp()
        }
        if (this.config.embed.footer) {
          embed.setFooter({
            text: this.config.embed.footer,
            iconURL: this.config.embed.footerIconUrl,
          })
        }
        await channel.send({ embeds: [embed] })
      } catch (error) {
        console.error("Error sending member leave message:", error)
      }
    })
  },
  /**
   * @param {Guild} guild
   * @returns {boolean}
   */
  checkBotPermissions(guild) {
    const botMember = guild.members.cache.get(guild.client.user.id)
    if (!botMember) return false
    return botMember.permissions.has(PermissionFlagsBits.MANAGE_GUILD)
  },
  /**
   * @param {Client} client
   */
  async refreshInvitesCache(client) {
    console.log("Refreshing invites cache for all guilds...")
    let successCount = 0
    let errorCount = 0
    this.guildInvitesCache = new Collection()
    for (const guild of client.guilds.cache.values()) {
      try {
        await this.fetchGuildInvites(guild)
        successCount++
      } catch (error) {
        console.error(`Error fetching invites for guild ${guild.id}:`, error)
        errorCount++
      }
    }
    console.log(`Invites cache refresh complete. Success: ${successCount}, Errors: ${errorCount}`)
  },
  /**
   * @param {Guild} guild
   */
  async fetchGuildInvites(guild) {
    try {
      if (!this.checkBotPermissions(guild)) {
        console.warn(`Bot doesn't have permission to fetch invites in guild ${guild.name} (${guild.id})`)
        return
      }
      const guildInvites = await guild.invites.fetch()
      if (this.config.debug) {
        console.log(`Fetched ${guildInvites.size} invites for guild ${guild.name} (${guild.id})`)
      }
      this.guildInvitesCache.set(guild.id, new Collection(guildInvites.map((invite) => [invite.code, invite])))
      if (!this.invites.has(guild.id)) {
        this.invites.set(guild.id, new Collection())
      }
      guildInvites.forEach((invite) => {
        const existingInvite = this.invites.get(guild.id).get(invite.code)
        this.invites.get(guild.id).set(invite.code, {
          code: invite.code,
          uses: invite.uses,
          maxUses: invite.maxUses,
          creator: invite.inviter
            ? {
                id: invite.inviter.id,
                tag: invite.inviter.tag,
              }
            : null,
          channel: {
            id: invite.channel.id,
            name: invite.channel.name,
          },
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          activeMembers: existingInvite ? existingInvite.activeMembers || [] : [],
          leftMembers: existingInvite ? existingInvite.leftMembers || [] : [],
        })
      })
      const currentInviteCodes = new Set(guildInvites.map((invite) => invite.code))
      const storedInvites = this.invites.get(guild.id)
      for (const [code, _] of storedInvites.entries()) {
        if (!currentInviteCodes.has(code)) {
          console.log(`Removing stale invite ${code} from local data for guild ${guild.id}`)
          storedInvites.delete(code)
        }
      }
      this.saveData()
      console.log(`Successfully updated invites for guild ${guild.name} (${guild.id}): ${guildInvites.size} invites`)
    } catch (error) {
      console.error(`Error fetching invites for guild ${guild.id}:`, error)
    }
  },
  loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, "utf8"))
        if (data.trackingChannelId) {
          this.trackingChannelId = data.trackingChannelId
        }
        if (data.invites) {
          Object.keys(data.invites).forEach((guildId) => {
            this.invites.set(guildId, new Collection())
            Object.keys(data.invites[guildId]).forEach((code) => {
              this.invites.get(guildId).set(code, data.invites[guildId][code])
            })
          })
        }
        if (data.memberJoinData) {
          Object.keys(data.memberJoinData).forEach((key) => {
            this.memberJoinData.set(key, data.memberJoinData[key])
          })
        }
      }
    } catch (error) {
      console.error("Error loading invite tracker data:", error)
    }
  },
  saveData() {
    try {
      const dataDir = path.dirname(this.dataPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      const data = {
        trackingChannelId: this.trackingChannelId,
        invites: {},
        memberJoinData: {},
      }
      this.invites.forEach((guildInvites, guildId) => {
        data.invites[guildId] = {}
        guildInvites.forEach((invite, code) => {
          data.invites[guildId][code] = invite
        })
      })
      this.memberJoinData.forEach((value, key) => {
        data.memberJoinData[key] = value
      })
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("Error saving invite tracker data:", error)
    }
  },
  /**
   * @param {string} channelId
   */
  setTrackingChannel(channelId) {
    this.trackingChannelId = channelId
    this.saveData()
    return true
  },
  /**
   * @param {Client} client
   * @param {string} inviteCode
   */
  async getInviteInfo(client, inviteCode) {
    try {
      const invite = await client.fetchInvite(inviteCode).catch(() => null)
      if (invite) {
        let activeInvitesCount = 0
        let totalUses = 0
        let activeCount = 0
        let leftCount = 0
        if (invite.inviter && invite.guild) {
          const guildInvites = this.invites.get(invite.guild.id)
          if (guildInvites) {
            const inviteData = guildInvites.get(invite.code)
            if (inviteData) {
              activeCount = inviteData.activeMembers ? inviteData.activeMembers.length : 0
              leftCount = inviteData.leftMembers ? inviteData.leftMembers.length : 0
            }
            guildInvites.forEach((inv) => {
              if (inv.creator && inv.creator.id === invite.inviter.id) {
                activeInvitesCount++
                totalUses += inv.uses
              }
            })
          }
        }
        return {
          code: invite.code,
          uses: invite.uses,
          maxUses: invite.maxUses,
          creator: invite.inviter
            ? {
                id: invite.inviter.id,
                tag: invite.inviter.tag,
              }
            : null,
          guild: {
            id: invite.guild.id,
            name: invite.guild.name,
          },
          channel: {
            id: invite.channel.id,
            name: invite.channel.name,
          },
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          activeInvitesCount,
          totalUses,
          activeCount,
          leftCount,
        }
      }
      for (const [guildId, guildInvites] of this.invites.entries()) {
        const storedInvite = guildInvites.get(inviteCode)
        if (storedInvite) {
          const guild = client.guilds.cache.get(guildId)
          let activeInvitesCount = 0
          let totalUses = 0
          const activeCount = storedInvite.activeMembers ? storedInvite.activeMembers.length : 0
          const leftCount = storedInvite.leftMembers ? storedInvite.leftMembers.length : 0
          if (storedInvite.creator) {
            guildInvites.forEach((inv) => {
              if (inv.creator && inv.creator.id === storedInvite.creator.id) {
                activeInvitesCount++
                totalUses += inv.uses
              }
            })
          }
          return {
            ...storedInvite,
            guild: {
              id: guildId,
              name: guild ? guild.name : "Unknown Server",
            },
            activeInvitesCount,
            totalUses,
            activeCount,
            leftCount,
          }
        }
      }
      return null
    } catch (error) {
      console.error(`Error getting invite info for ${inviteCode}:`, error)
      return null
    }
  },
  /**
   * @param {Client} client
   * @param {string} inviteCode
   */
  async deleteInvite(client, inviteCode) {
    try {
      console.log(`Attempting to delete invite with code: ${inviteCode}`)
      try {
        const invite = await client.fetchInvite(inviteCode).catch((err) => {
          console.log(`Could not fetch invite ${inviteCode} from Discord API: ${err.message}`)
          return null
        })
        if (invite) {
          console.log(`Found invite ${inviteCode} via Discord API, attempting to delete...`)
          await invite.delete()
          console.log(`Successfully deleted invite ${inviteCode} via Discord API`)
          for (const [guildId, guildInvites] of this.invites.entries()) {
            if (guildInvites.has(inviteCode)) {
              guildInvites.delete(inviteCode)
              console.log(`Removed invite ${inviteCode} from local cache for guild ${guildId}`)
            }
          }
          for (const [guildId, guildInvites] of this.guildInvitesCache.entries()) {
            if (guildInvites.has(inviteCode)) {
              guildInvites.delete(inviteCode)
              console.log(`Removed invite ${inviteCode} from guild invites cache for guild ${guildId}`)
            }
          }
          this.saveData()
          return true
        }
      } catch (apiError) {
        console.error(`Error deleting invite ${inviteCode} via Discord API:`, apiError)
      }
      let deletedFromAnyGuild = false
      for (const [guildId, guildInvites] of this.invites.entries()) {
        if (guildInvites.has(inviteCode)) {
          console.log(`Found invite ${inviteCode} in local data for guild ${guildId}`)
          const guild = client.guilds.cache.get(guildId)
          if (guild) {
            const botMember = guild.members.cache.get(client.user.id)
            if (!botMember || !botMember.permissions.has(PermissionFlagsBits.MANAGE_GUILD)) {
              console.warn(`Bot doesn't have MANAGE_GUILD permission in guild ${guild.name} (${guildId})`)
              continue
            }
            try {
              const fetchedInvites = await guild.invites.fetch()
              const inviteToDelete = fetchedInvites.find((i) => i.code === inviteCode)
              if (inviteToDelete) {
                console.log(`Found invite ${inviteCode} in guild ${guild.name}, attempting to delete...`)
                await inviteToDelete.delete()
                console.log(`Successfully deleted invite ${inviteCode} from guild ${guild.name}`)
                deletedFromAnyGuild = true
              } else {
                console.log(`Invite ${inviteCode} not found in guild ${guild.name} invites`)
              }
            } catch (guildError) {
              console.error(`Error fetching invites for guild ${guild.name}:`, guildError)
            }
          }
          guildInvites.delete(inviteCode)
          console.log(`Removed invite ${inviteCode} from local data for guild ${guildId}`)
          deletedFromAnyGuild = true
        }
      }
      for (const [guildId, guildInvites] of this.guildInvitesCache.entries()) {
        if (guildInvites.has(inviteCode)) {
          guildInvites.delete(inviteCode)
          console.log(`Removed invite ${inviteCode} from guild invites cache for guild ${guildId}`)
          deletedFromAnyGuild = true
        }
      }
      if (deletedFromAnyGuild) {
        this.saveData()
        return true
      }
      console.log(`Invite ${inviteCode} not found in any guild or local data`)
      return false
    } catch (error) {
      console.error(`Error in deleteInvite function for invite ${inviteCode}:`, error)
      return false
    }
  },
  /**
   * @returns {Object}
   */
  getAllInvites() {
    const result = []
    this.invites.forEach((guildInvites, guildId) => {
      guildInvites.forEach((invite) => {
        let activeInvitesCount = 0
        let totalUses = 0
        const activeCount = invite.activeMembers ? invite.activeMembers.length : 0
        const leftCount = invite.leftMembers ? invite.leftMembers.length : 0
        if (invite.creator) {
          guildInvites.forEach((inv) => {
            if (inv.creator && inv.creator.id === invite.creator.id) {
              activeInvitesCount++
              totalUses += inv.uses
            }
          })
        }
        result.push({
          ...invite,
          guildId,
          activeInvitesCount,
          totalUses,
          activeCount,
          leftCount,
        })
      })
    })
    return result
  },
  /**
   * @param {string} userId
   * @returns {Object}
   */
  getUserInvites(userId) {
    const userInvites = []
    let totalUses = 0
    let activeCount = 0
    let leftCount = 0
    this.invites.forEach((guildInvites, guildId) => {
      guildInvites.forEach((invite) => {
        if (invite.creator && invite.creator.id === userId) {
          const inviteActiveCount = invite.activeMembers ? invite.activeMembers.length : 0
          const inviteLeftCount = invite.leftMembers ? invite.leftMembers.length : 0
          userInvites.push({
            ...invite,
            guildId,
            activeCount: inviteActiveCount,
            leftCount: inviteLeftCount,
          })

          totalUses += invite.uses
          activeCount += inviteActiveCount
          leftCount += inviteLeftCount
        }
      })
    })
    userInvites.sort((a, b) => b.uses - a.uses)
    return {
      invites: userInvites,
      totalUses,
      activeCount,
      leftCount,
    }
  },
  /**
   * @param {Client} client
   */
  async verifyMemberStatus(client) {
    console.log("Verifying member status for all invites...")
    let updatedCount = 0
    for (const [guildId, guildInvites] of this.invites.entries()) {
      const guild = client.guilds.cache.get(guildId)
      if (!guild) {
        console.log(`Guild ${guildId} not found, skipping verification`)
        continue
      }
      console.log(`Verifying member status in guild: ${guild.name} (${guildId})`)
      await guild.members.fetch()
      for (const [inviteCode, inviteData] of guildInvites.entries()) {
        let updated = false
        if (inviteData.activeMembers && inviteData.activeMembers.length > 0) {
          const newActiveMembers = []
          const newLeftMembers = inviteData.leftMembers ? [...inviteData.leftMembers] : []
          for (const member of inviteData.activeMembers) {
            const guildMember = guild.members.cache.get(member.id)
            if (!guildMember) {
              console.log(`Member ${member.tag} (${member.id}) has left the server, updating status`)
              newLeftMembers.push({
                ...member,
                leftAt: Date.now(), 
              })
              updated = true
            } else {
              newActiveMembers.push(member)
            }
          }
          if (updated) {
            inviteData.activeMembers = newActiveMembers
            inviteData.leftMembers = newLeftMembers
            guildInvites.set(inviteCode, inviteData)
            updatedCount++
          }
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`Updated member status for ${updatedCount} invites`)
      this.saveData()
    } else {
      console.log("No member status updates needed")
    }
    return updatedCount
  },
}
