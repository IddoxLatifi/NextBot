const { EmbedBuilder } = require("discord.js")
const welcomeConfig = require("../config/welcome")

// Rate limiting for welcome messages
const welcomeCooldowns = new Map()

module.exports = {
  name: "welcome",
  /**
   * @param {Client} client
   */
  init(client) {
    console.log("Welcome module initialized")
  },
  /**
   * @param {string} text
   * @returns {string}
   */
  replaceChannelPlaceholders(text) {
    if (!text) return text
    let replacedText = text
    if (welcomeConfig.channels) {
      for (const [channelName, channelId] of Object.entries(welcomeConfig.channels)) {
        const placeholder = `{${channelName}}`
        if (replacedText.includes(placeholder)) {
          replacedText = replacedText.replace(new RegExp(placeholder, "g"), `<#${channelId}>`)
        }
      }
    }
    return replacedText
  },
  /**
   * @param {GuildMember} member
   * @param {Client} client
   */
  async handleMemberJoin(member, client) {
    try {
      if (!welcomeConfig.enabled) {
        return
      }

      // Rate limiting check
      if (welcomeConfig.rateLimit && welcomeConfig.rateLimit.enabled) {
        const cooldownKey = `${member.guild.id}-${member.id}`
        const now = Date.now()
        const cooldownTime = welcomeConfig.rateLimit.cooldownTime || 30000 // 30 seconds cooldown
        
        if (welcomeCooldowns.has(cooldownKey)) {
          const lastWelcome = welcomeCooldowns.get(cooldownKey)
          if (now - lastWelcome < cooldownTime) {
            console.log(`Welcome message skipped for ${member.user.tag} due to rate limiting`)
            return
          }
        }
        
        // Set cooldown
        welcomeCooldowns.set(cooldownKey, now)
        
        // Clean up old cooldowns
        const cleanupInterval = welcomeConfig.rateLimit.cleanupInterval || 300000 // 5 minutes
        for (const [key, timestamp] of welcomeCooldowns.entries()) {
          if (now - timestamp > cleanupInterval) {
            welcomeCooldowns.delete(key)
          }
        }
      }

      const _createdBy = "@apt_start_latifi | https://iddox.tech/ | https://discord.gg/KcuMUUAP5T"
      const welcomeChannelId = process.env.WELCOME_CHANNEL_ID
      const welcomeChannel = await member.guild.channels.fetch(welcomeChannelId).catch(() => null)
      if (!welcomeChannel) {
        console.error(`Welcome channel ${welcomeChannelId} not found`)
        return
      }
      const description = this.replaceChannelPlaceholders(
        welcomeConfig.description.replace("{user}", `<@${member.id}>`),
      )
      const embed = new EmbedBuilder()
        .setColor(welcomeConfig.embedColor)
        .setTitle(welcomeConfig.title.replace("{username}", member.user.username))
        .setDescription(description)
      embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      const fields = []
      if (welcomeConfig.showUserInfo.createdAt) {
        fields.push({
          name: "Account created",
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        })
      }
      if (welcomeConfig.showUserInfo.joinedAt) {
        fields.push({
          name: "Joined",
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
          inline: true,
        })
      }
      if (welcomeConfig.showUserInfo.memberCount) {
        fields.push({
          name: "Members",
          value: `${member.guild.memberCount}`,
          inline: true,
        })
      }
      if (welcomeConfig.showUserInfo.accountAge) {
        const createdDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24))
        fields.push({
          name: "Account age",
          value: `${createdDays} days`,
          inline: true,
        })
      }
      if (welcomeConfig.showUserInfo.userRoles && welcomeConfig.defaultRoles.length > 0) {
        const rolesList = welcomeConfig.defaultRoles.map((roleId) => `<@&${roleId}>`).join(", ")
        fields.push({
          name: "Assigned roles",
          value: rolesList || "None",
          inline: false,
        })
      }
      if (welcomeConfig.customFields && welcomeConfig.customFields.length > 0) {
        const processedFields = welcomeConfig.customFields.map((field) => {
          return {
            name: field.name,
            value: this.replaceChannelPlaceholders(field.value),
            inline: field.inline,
          }
        })
        fields.push(...processedFields)
      }
      if (fields.length > 0) {
        embed.addFields(fields)
      }
      if (welcomeConfig.bannerImage) {
        embed.setImage(welcomeConfig.bannerImage)
      }
      else if (welcomeConfig.showUserInfo.userBanner) {
        try {
          const user = await client.users.fetch(member.id, { force: true })
          if (user.banner) {
            embed.setImage(user.bannerURL({ dynamic: true, size: 1024 }))
          }
        } catch (error) {
          console.error("Error fetching user banner:", error)
        }
      }
      const footerText = welcomeConfig.footerText.replace("{guildName}", member.guild.name)
      embed.setTimestamp().setFooter({
        text: footerText,
        iconURL: welcomeConfig.footerIconUrl || member.guild.iconURL(),
      })
      await welcomeChannel.send({
        content: welcomeConfig.mentionUser ? `<@${member.id}>` : null,
        embeds: [embed],
      })
      if (welcomeConfig.sendDM) {
        try {
          console.log(`Attempting to send welcome DM to ${member.user.tag} (${member.id})`)
          let inviteUrl = welcomeConfig.serverInvite || ""
          if (!inviteUrl && welcomeConfig.createInviteForDM) {
            try {
              const invite = await welcomeChannel.createInvite({
                maxAge: 0, 
                maxUses: 0,
                unique: true,
                reason: `Welcome DM for new member: ${member.user.tag}`,
              })
              inviteUrl = invite.url
            } catch (inviteError) {
              console.error("Could not create invite:", inviteError)
            }
          }
          let dmDescription = welcomeConfig.dmMessage.replace("{user}", member.user.username)
          dmDescription = this.replaceChannelPlaceholders(dmDescription)
          if (inviteUrl) {
            dmDescription = dmDescription.replace("{invite}", inviteUrl)
          } else {
            dmDescription = dmDescription.replace("{invite}", "")
          }
          const dmEmbed = new EmbedBuilder()
            .setColor(welcomeConfig.embedColor)
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(dmDescription)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp()
          const dmFooterText = welcomeConfig.footerText.replace("{guildName}", member.guild.name)
          dmEmbed.setFooter({
            text: dmFooterText,
            iconURL: welcomeConfig.footerIconUrl || member.guild.iconURL(),
          })
          if (welcomeConfig.bannerImage) {
            dmEmbed.setImage(welcomeConfig.bannerImage)
          }
          const user = await client.users.fetch(member.id, { force: true })
          await user.send({ embeds: [dmEmbed] })
          console.log(`Successfully sent welcome DM to ${member.user.tag} (${member.id})`)
        } catch (error) {
          console.error(`Error sending welcome DM to ${member.user.tag} (${member.id}):`, error)
          const isDMDisabled =
            error.message &&
            (error.message.includes("Cannot send messages to this user") ||
              error.message.includes("Missing Access") ||
              error.message.includes("Forbidden"))
          if (isDMDisabled) {
            console.log(`User ${member.user.tag} has DMs disabled or blocked the bot`)
            await welcomeChannel
              .send({
                content: `⚠️ Could not send welcome message to ${member.user.tag}. The user may have DMs disabled.`,
                ephemeral: true,
              })
              .catch(() => {})
          }
        }
      }
      if (welcomeConfig.defaultRoleId) {
        try {
          await member.roles.add(welcomeConfig.defaultRoleId)
        } catch (error) {
          console.error("Error adding default role:", error)
        }
      }
      if (welcomeConfig.defaultRoles && welcomeConfig.defaultRoles.length > 0) {
        try {
          await member.roles.add(welcomeConfig.defaultRoles)
        } catch (error) {
          console.error("Error adding default roles:", error)
        }
      }
    } catch (error) {
      console.error("Error in welcome module:", error)
    }
  },
}
