const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const fs = require("fs")
const path = require("path")
const roleReactConfig = require("../config/rolereact")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
const DATA_DIR = path.join(__dirname, "../../data")
const ROLE_REACT_DIR = path.join(DATA_DIR, "role-react")
const config = require('../config/rolereact.js');
function replaceChannelIdPlaceholders(text) {
    return text.replace(/\{channelid:(\d+)\}/g, (_, channelId) => `<#${channelId}>`);
}
function ensureDirectoriesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(ROLE_REACT_DIR)) {
    fs.mkdirSync(ROLE_REACT_DIR, { recursive: true })
  }
}
module.exports = {
  name: "rolereact",

  /**
   * @param {Client} client
   */
  init(client) {
    ensureDirectoriesExist()
    console.log("RoleReact module initialized")
    this.loadRoleReactions(client)
  },
  async loadRoleReactions(client) {
    try {
      ensureDirectoriesExist()
      const configFromFile = require("../config/rolereact")
      const configPath = path.join(ROLE_REACT_DIR, "config.json")
      let config = {}
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"))
      } else {
        config = {
          channelId: configFromFile.channelId || "",
          messageId: "",
        }
        this.saveRoleReactConfig(config)
      }
      client.roleReactConfig = config
      const rolesPath = path.join(ROLE_REACT_DIR, "roles.json")
      if (!fs.existsSync(rolesPath)) {
        console.log("No role reaction roles found")
        client.roleReactRoles = []
        return
      }
      const roles = JSON.parse(fs.readFileSync(rolesPath, "utf8"))
      client.roleReactRoles = roles
      console.log(`Loaded ${roles.length} role reactions`)
    } catch (error) {
      console.error("Error loading role reactions:", error)
    }
  },
  /**
   * @param {Object} config
   */
  saveRoleReactConfig(config) {
    ensureDirectoriesExist()
    const configPath = path.join(ROLE_REACT_DIR, "config.json")
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  },
  /**
   * @param {Array} roles 
   */
  saveRoleReactRoles(roles) {
    ensureDirectoriesExist()
    const rolesPath = path.join(ROLE_REACT_DIR, "roles.json")
    fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2))
  },
  async setChannel(interaction, client, channelId) {
    try {
      const channel = await client.channels.fetch(channelId).catch(() => null)
      if (!channel) {
        return interaction.reply({
          content: "The specified channel was not found.",
          ephemeral: true,
        })
      }
      const config = client.roleReactConfig || {}
      config.channelId = channelId
      this.saveRoleReactConfig(config)
      client.roleReactConfig = config
      this.updateConfigFile(channelId)
      return interaction.reply({
        content: `The channel for role reactions has been set to <#${channelId}>.`,
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error setting role reaction channel:", error)
      return interaction.reply({
        content: "An error occurred while setting the channel.",
        ephemeral: true,
      })
    }
  },
  /**
   * @param {string} channelId 
   */
  updateConfigFile(channelId) {
    try {
      const fs = require("fs")
      const path = require("path")
      const configPath = path.join(__dirname, "../config/rolereact.js")
      let configContent = fs.readFileSync(configPath, "utf8")
      configContent = configContent.replace(/channelId: ".*?"/, `channelId: "${channelId}"`)
      fs.writeFileSync(configPath, configContent, "utf8")
      console.log(`Updated rolereact config file with channel ID: ${channelId}`)
    } catch (error) {
      console.error("Error updating rolereact config file:", error)
    }
  },
  /**
   * @param {Interaction} interaction 
   * @param {Client} client 
   * @param {Object} roleData 
   */
  async addRole(interaction, client, roleData) {
    try {
      const role = await interaction.guild.roles.fetch(roleData.roleId).catch(() => null)
      if (!role) {
        return interaction.reply({
          content: "The specified role was not found.",
          ephemeral: true,
        })
      }
      if (!client.roleReactConfig || !client.roleReactConfig.channelId) {
        return interaction.reply({
          content: "Please set a channel first with `/rolereact set channel`.",
          ephemeral: true,
        })
      }
      const roles = client.roleReactRoles || []
      const existingRoleIndex = roles.findIndex((r) => r.roleId === roleData.roleId)
      if (existingRoleIndex !== -1) {
        roles[existingRoleIndex] = roleData
      } else {
        roles.push(roleData)
      }
      this.saveRoleReactRoles(roles)
      client.roleReactRoles = roles
      return interaction.reply({
        content: `The role ${role.name} has been added to the role reactions.`,
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error adding role reaction:", error)
      return interaction.reply({
        content: "An error occurred while adding the role.",
        ephemeral: true,
      })
    }
  },

  /**
   * @param {Interaction} interaction 
   * @param {Client} client 
   * @param {string} roleId 
   */
  async removeRole(interaction, client, roleId) {
    try {
      if (!client.roleReactConfig || !client.roleReactConfig.channelId) {
        return interaction.reply({
          content: "No channel has been set for role reactions yet.",
          ephemeral: true,
        })
      }
      if (!client.roleReactRoles || client.roleReactRoles.length === 0) {
        return interaction.reply({
          content: "No roles have been added for role reactions yet.",
          ephemeral: true,
        })
      }
      const roleIndex = client.roleReactRoles.findIndex((r) => r.roleId === roleId)
      if (roleIndex === -1) {
        return interaction.reply({
          content: "The specified role was not found in the role reactions.",
          ephemeral: true,
        })
      }
      const roleName = client.roleReactRoles[roleIndex].name
      const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
      client.roleReactRoles.splice(roleIndex, 1)
      this.saveRoleReactRoles(client.roleReactRoles)
      return interaction.reply({
        content: `The role ${roleName} has been removed from the role reactions.`,
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error removing role reaction:", error)
      return interaction.reply({
        content: "An error occurred while removing the role.",
        ephemeral: true,
      })
    }
  },
  async sendRoleReactionMessage(interaction, client) {
    try {
      if (!client.roleReactConfig || !client.roleReactConfig.channelId) {
        return interaction.reply({
          content: "Please set a channel first with `/rolereact set channel`.",
          ephemeral: true,
        })
      }
      if (!client.roleReactRoles || client.roleReactRoles.length === 0) {
        return interaction.reply({
          content: "Please add roles first with `/rolereact add`.",
          ephemeral: true,
        })
      }
      const channel = await client.channels.fetch(client.roleReactConfig.channelId).catch(() => null)
      if (!channel) {
        return interaction.reply({
          content: "The configured channel was not found.",
          ephemeral: true,
        })
      }
      const embed = new EmbedBuilder()
        .setColor(roleReactConfig.embedColor)
        .setTitle(roleReactConfig.title)
        .setDescription(roleReactConfig.description)
      if (roleReactConfig.bannerUrl) {
        embed.setImage(roleReactConfig.bannerUrl)
      }
      if (roleReactConfig.thumbnailUrl) {
        embed.setThumbnail(roleReactConfig.thumbnailUrl)
      }
      if (roleReactConfig.footerText) {
        embed.setFooter({
          text: roleReactConfig.footerText,
          iconURL: roleReactConfig.footerIconUrl || null,
        })
      }
      const rows = []
      let currentRow = new ActionRowBuilder()
      let buttonCount = 0
      for (const role of client.roleReactRoles) {
        if (buttonCount === 5) {
          rows.push(currentRow)
          currentRow = new ActionRowBuilder()
          buttonCount = 0
        }
        const button = new ButtonBuilder()
          .setCustomId(`rolereact_${role.roleId}`)
          .setLabel(role.name)
          .setStyle(this.getButtonStyle(role.color))
        if (role.emoji) {
          button.setEmoji(role.emoji)
        }
        currentRow.addComponents(button)
        buttonCount++
      }
      if (buttonCount > 0) {
        rows.push(currentRow)
      }
      const description = replaceChannelIdPlaceholders(config.description);
      embed.setDescription(description);
      let messageId = client.roleReactConfig.messageId
      let message
      if (messageId) {
        try {
          message = await channel.messages.fetch(messageId).catch(() => null)
          if (message) {
            await message.edit({
              embeds: [embed],
              components: rows,
            })
          } else {
            message = await channel.send({
              embeds: [embed],
              components: rows,
            })
            messageId = message.id
          }
        } catch (error) {
          console.error("Error updating role reaction message:", error)
          message = await channel.send({
            embeds: [embed],
            components: rows,
          })
          messageId = message.id
        }
      } else {
        message = await channel.send({
          embeds: [embed],
          components: rows,
        })
        messageId = message.id
      }
      client.roleReactConfig.messageId = messageId
      this.saveRoleReactConfig(client.roleReactConfig)
      return interaction.reply({
        content: `The role reaction message has been sent to <#${channel.id}>.`,
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error sending role reaction message:", error)
      return interaction.reply({
        content: "An error occurred while sending the role reaction message.",
        ephemeral: true,
      })
    }
  },

  /**
   * @param {Interaction} interaction
   * @param {Client} client 
   */
  async handleButtonInteraction(interaction, client) {
    try {
      if (!interaction.customId.startsWith("rolereact_")) return
      const roleId = interaction.customId.replace("rolereact_", "")
      const role = await interaction.guild.roles.fetch(roleId).catch(() => null)
      if (!role) {
        return interaction.reply({
          content: "The selected role no longer exists.",
          ephemeral: true,
        })
      }
      const member = interaction.member
      const hasRole = member.roles.cache.has(roleId)
      if (hasRole) {
        await member.roles.remove(roleId)
        return interaction.reply({
          content: `The role ${role.name} has been removed.`,
          ephemeral: true,
        })
      } else {
        await member.roles.add(roleId)
        return interaction.reply({
          content: `The role ${role.name} has been added.`,
          ephemeral: true,
        })
      }
    } catch (error) {
      console.error("Error handling role reaction button:", error)
      return interaction.reply({
        content: "An error occurred while processing the role reaction.",
        ephemeral: true,
      })
    }
  },
  /**
   * @param {string} color 
   * @returns {ButtonStyle} 
   */
  getButtonStyle(color) {
    const styles = {
      blue: ButtonStyle.Primary,
      green: ButtonStyle.Success,
      red: ButtonStyle.Danger,
      grey: ButtonStyle.Secondary,
    }
    return styles[color] || ButtonStyle.Secondary
  },
  /**
   * @param {Interaction} interaction 
   * @param {Client} client 
   */
  async listRoles(interaction, client) {
    try {
      if (!client.roleReactRoles || client.roleReactRoles.length === 0) {
        return interaction.reply({
          content: "No roles have been added for role reactions yet.",
          ephemeral: true,
        })
      }
      let roleList = "**Available Role Reactions:**\n\n"
      for (const roleData of client.roleReactRoles) {
        const role = await interaction.guild.roles.fetch(roleData.roleId).catch(() => null)
        const roleName = role ? role.name : "Unknown Role"
        const emoji = roleData.emoji || "❓"
        roleList += `- ${emoji} **${roleName}** (${roleData.color})\n`
      }
      return interaction.reply({
        content: roleList,
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error listing role reactions:", error)
      return interaction.reply({
        content: "An error occurred while listing the role reactions.",
        ephemeral: true,
      })
    }
  },
}