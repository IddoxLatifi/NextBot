const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js")
const inviteTracker = require("../../modules/inviteTracker")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"

module.exports = {
  data: new SlashCommandBuilder()
    .setName("traceinvite")
    .setDescription("Manages the invite tracking system")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Sets the channel for invite tracking")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel where invite tracking information will be sent")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Shows all tracked invites")
        .addIntegerOption((option) =>
          option.setName("page").setDescription("The page number (starting at 1)").setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Shows information about a specific invite")
        .addStringOption((option) =>
          option.setName("code").setDescription("The invite code or full invite URL").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Shows invite statistics for a user")
        .addUserOption((option) =>
          option.setName("user").setDescription("The user to check (defaults to yourself)").setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("verify").setDescription("Verify and update active/left member status for all invites"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("leaderboard").setDescription("Shows the top inviters in the server"),
    )
    // Füge eine Funktion hinzu, um den Einladungs-Cache manuell zu aktualisieren
    .addSubcommand((subcommand) =>
      subcommand.setName("refresh").setDescription("Manually refresh the invite cache for all guilds"),
    ),
  permissions: {
    user: [], // No permissions required for basic commands
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: false,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand()

    function extractInviteCode(input) {
      const regex = /(discord\.gg\/|discordapp\.com\/invite\/|discord\.com\/invite\/)?([a-zA-Z0-9-]+)/i
      const match = input.match(regex)
      return match ? match[2] : input
    }

    // Check if user has admin permissions for restricted commands
    const hasAdminPerms = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)

    if (subcommand === "set") {
      // Only admins can set the tracking channel
      if (!hasAdminPerms) {
        return interaction.reply({
          content: "You don't have permission to use this command. You need the 'Manage Server' permission.",
          ephemeral: true,
        })
      }

      const channel = interaction.options.getChannel("channel")
      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({
          content: "The selected channel must be a text channel.",
          ephemeral: true,
        })
      }
      inviteTracker.setTrackingChannel(channel.id)
      return interaction.reply({
        content: `The invite tracking channel has been set to ${channel}.`,
        ephemeral: true,
      })
    } else if (subcommand === "verify") {
      // Only admins can verify member status
      if (!hasAdminPerms) {
        return interaction.reply({
          content: "You don't have permission to use this command. You need the 'Manage Server' permission.",
          ephemeral: true,
        })
      }

      await interaction.deferReply()
      const updatedCount = await inviteTracker.verifyMemberStatus(client)

      return interaction.editReply({
        content:
          updatedCount > 0
            ? `✅ Successfully verified and updated member status for ${updatedCount} invites.`
            : "✅ Verification complete. No updates were needed.",
        ephemeral: false,
      })
    } else if (subcommand === "list") {
      const page = interaction.options.getInteger("page") || 1
      const pageSize = 10

      // Refresh invites before listing
      await interaction.deferReply()

      // Verify member status first
      await inviteTracker.verifyMemberStatus(client)

      // Aktualisiere den Einladungs-Cache
      await inviteTracker.refreshInvitesCache(client)

      // Get all invites
      const allInvites = inviteTracker.getAllInvites()
      if (allInvites.length === 0) {
        return interaction.editReply({
          content: "No invites found.",
          ephemeral: true,
        })
      }

      allInvites.sort((a, b) => b.uses - a.uses)
      const totalPages = Math.ceil(allInvites.length / pageSize)
      const validPage = Math.max(1, Math.min(page, totalPages))
      const startIndex = (validPage - 1) * pageSize
      const endIndex = Math.min(startIndex + pageSize, allInvites.length)
      const displayInvites = allInvites.slice(startIndex, endIndex)

      const embed = new EmbedBuilder()
        .setColor(inviteTracker.config.embedColors.info)
        .setTitle("📊 Tracked Invites")
        .setFooter({ text: `Page ${validPage} of ${totalPages}` })
        .setTimestamp()

      let description = `Total ${allInvites.length} invites found.\n\n`
      for (let i = 0; i < displayInvites.length; i++) {
        const invite = displayInvites[i]
        const guild = client.guilds.cache.get(invite.guildId)
        const guildName = guild ? guild.name : "Unknown Server"

        description += `**${i + 1}. Invite code: \`${invite.code}\`**\n`
        description += `Server: ${guildName}\n`
        description += `Channel: <#${invite.channel.id}>\n`
        description += `Creator: ${invite.creator ? `<@${invite.creator.id}> (${invite.activeCount}/${invite.uses} active invites)` : "Unknown"}\n`
        description += `Uses: ${invite.uses}${invite.maxUses ? `/${invite.maxUses}` : ""}\n`
        description += `Created: <t:${Math.floor(new Date(invite.createdAt).getTime() / 1000)}:R>\n\n`
      }

      embed.setDescription(description)

      const navigationRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`traceinvite_prev_${validPage}`)
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(validPage <= 1),
        new ButtonBuilder()
          .setCustomId(`traceinvite_next_${validPage}`)
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(validPage >= totalPages),
      )

      // Only add delete buttons if user has admin permissions
      const allRows = [navigationRow]

      if (hasAdminPerms) {
        const deleteRows = []
        for (let i = 0; i < displayInvites.length; i += 5) {
          const row = new ActionRowBuilder()
          for (let j = i; j < Math.min(i + 5, displayInvites.length); j++) {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`traceinvite_delete_${displayInvites[j].code}`)
                .setLabel(`${j + 1} delete`)
                .setStyle(ButtonStyle.Danger),
            )
          }
          deleteRows.push(row)
        }
        allRows.push(...deleteRows)
      }

      const response = await interaction.editReply({
        embeds: [embed],
        components: allRows,
        ephemeral: false,
      })

      const collector = response.createMessageComponentCollector({
        time: 300000, // 5 minutes timeout
      })

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: "You cannot use these buttons.", ephemeral: true })
        }

        const [action, type, value] = i.customId.split("_")

        if (type === "prev" || type === "next") {
          const currentPage = Number.parseInt(value)
          const newPage = type === "prev" ? currentPage - 1 : currentPage + 1
          const newStartIndex = (newPage - 1) * pageSize
          const newEndIndex = Math.min(newStartIndex + pageSize, allInvites.length)
          const newDisplayInvites = allInvites.slice(newStartIndex, newEndIndex)

          let newDescription = `Total ${allInvites.length} invites found.\n\n`
          for (let i = 0; i < newDisplayInvites.length; i++) {
            const invite = newDisplayInvites[i]
            const guild = client.guilds.cache.get(invite.guildId)
            const guildName = guild ? guild.name : "Unknown Server"

            newDescription += `**${i + 1}. Invite code: \`${invite.code}\`**\n`
            newDescription += `Server: ${guildName}\n`
            newDescription += `Channel: <#${invite.channel.id}>\n`
            newDescription += `Creator: ${invite.creator ? `<@${invite.creator.id}> (${invite.activeCount}/${invite.uses} active invites)` : "Unknown"}\n`
            newDescription += `Uses: ${invite.uses}${invite.maxUses ? `/${invite.maxUses}` : ""}\n`
            newDescription += `Created: <t:${Math.floor(new Date(invite.createdAt).getTime() / 1000)}:R>\n\n`
          }

          const newEmbed = new EmbedBuilder()
            .setColor(inviteTracker.config.embedColors.info)
            .setTitle("📊 Tracked Invites")
            .setDescription(newDescription)
            .setFooter({ text: `Page ${newPage} of ${totalPages}` })
            .setTimestamp()

          const newNavigationRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`traceinvite_prev_${newPage}`)
              .setLabel("Previous")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(newPage <= 1),
            new ButtonBuilder()
              .setCustomId(`traceinvite_next_${newPage}`)
              .setLabel("Next")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(newPage >= totalPages),
          )

          const newAllRows = [newNavigationRow]

          if (hasAdminPerms) {
            const newDeleteRows = []
            for (let i = 0; i < newDisplayInvites.length; i += 5) {
              const row = new ActionRowBuilder()
              for (let j = i; j < Math.min(i + 5, newDisplayInvites.length); j++) {
                row.addComponents(
                  new ButtonBuilder()
                    .setCustomId(`traceinvite_delete_${newDisplayInvites[j].code}`)
                    .setLabel(`${j + 1} delete`)
                    .setStyle(ButtonStyle.Danger),
                )
              }
              newDeleteRows.push(row)
            }
            newAllRows.push(...newDeleteRows)
          }

          await i.update({
            embeds: [newEmbed],
            components: newAllRows,
          })
        } else if (type === "delete") {
          // Check if user has admin permissions for deletion
          if (!hasAdminPerms) {
            return i.reply({
              content: "You don't have permission to delete invites. You need the 'Manage Server' permission.",
              ephemeral: true,
            })
          }

          const inviteCode = value
          await i.deferUpdate({ ephemeral: true })

          try {
            console.log(`User ${i.user.tag} (${i.user.id}) is attempting to delete invite: ${inviteCode}`)
            const success = await inviteTracker.deleteInvite(client, inviteCode)

            if (success) {
              // Get updated invites after deletion
              const updatedInvites = inviteTracker.getAllInvites()
              updatedInvites.sort((a, b) => b.uses - a.uses)

              const totalPages = Math.ceil(updatedInvites.length / pageSize)
              const validPage = Math.max(1, Math.min(page, totalPages || 1))
              const startIndex = (validPage - 1) * pageSize
              const endIndex = Math.min(startIndex + pageSize, updatedInvites.length)
              const displayInvites = updatedInvites.slice(startIndex, endIndex)

              let newDescription = `Total ${updatedInvites.length} invites found.\n\n`

              if (displayInvites.length === 0) {
                newDescription += "No invites to display on this page."
              } else {
                for (let i = 0; i < displayInvites.length; i++) {
                  const invite = displayInvites[i]
                  const guild = client.guilds.cache.get(invite.guildId)
                  const guildName = guild ? guild.name : "Unknown Server"

                  newDescription += `**${i + 1}. Invite code: \`${invite.code}\`**\n`
                  newDescription += `Server: ${guildName}\n`
                  newDescription += `Channel: <#${invite.channel.id}>\n`
                  newDescription += `Creator: ${invite.creator ? `<@${invite.creator.id}> (${invite.activeCount}/${invite.uses} active invites)` : "Unknown"}\n`
                  newDescription += `Uses: ${invite.uses}${invite.maxUses ? `/${invite.maxUses}` : ""}\n`
                  newDescription += `Created: <t:${Math.floor(new Date(invite.createdAt).getTime() / 1000)}:R>\n\n`
                }
              }

              const newEmbed = new EmbedBuilder()
                .setColor(inviteTracker.config.embedColors.info)
                .setTitle("📊 Tracked Invites")
                .setDescription(newDescription)
                .setFooter({ text: `Page ${validPage} of ${totalPages || 1}` })
                .setTimestamp()

              const newNavigationRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`traceinvite_prev_${validPage}`)
                  .setLabel("Previous")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(validPage <= 1),
                new ButtonBuilder()
                  .setCustomId(`traceinvite_next_${validPage}`)
                  .setLabel("Next")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(validPage >= totalPages || validPage >= 1),
              )

              const newAllRows = [newNavigationRow]

              if (displayInvites.length > 0) {
                const newDeleteRows = []
                for (let i = 0; i < displayInvites.length; i += 5) {
                  const row = new ActionRowBuilder()
                  for (let j = i; j < Math.min(i + 5, displayInvites.length); j++) {
                    row.addComponents(
                      new ButtonBuilder()
                        .setCustomId(`traceinvite_delete_${displayInvites[j].code}`)
                        .setLabel(`${j + 1} delete`)
                        .setStyle(ButtonStyle.Danger),
                    )
                  }
                  newDeleteRows.push(row)
                }
                newAllRows.push(...newDeleteRows)
              }

              await i.editReply({
                embeds: [newEmbed],
                components: newAllRows,
              })

              await i.followUp({
                content: `The invite with code \`${inviteCode}\` has been successfully deleted.`,
                ephemeral: true,
              })
            } else {
              await i.followUp({
                content: `Failed to delete invite with code \`${inviteCode}\`. The invite may no longer exist or the bot may not have permission to delete it.`,
                ephemeral: true,
              })
            }
          } catch (error) {
            console.error(`Error handling delete button for invite ${inviteCode}:`, error)
            await i.followUp({
              content: `An error occurred while trying to delete the invite with code \`${inviteCode}\`. Please try again later.`,
              ephemeral: true,
            })
          }
        }
      })

      collector.on("end", () => {
        const disabledNavigationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`traceinvite_prev_${validPage}`)
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`traceinvite_next_${validPage}`)
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        )

        const disabledAllRows = [disabledNavigationRow]

        if (hasAdminPerms && displayInvites.length > 0) {
          const disabledDeleteRows = []
          for (let i = 0; i < displayInvites.length; i += 5) {
            const row = new ActionRowBuilder()
            for (let j = i; j < Math.min(i + 5, displayInvites.length); j++) {
              row.addComponents(
                new ButtonBuilder()
                  .setCustomId(`traceinvite_delete_${displayInvites[j].code}`)
                  .setLabel(`${j + 1} delete`)
                  .setStyle(ButtonStyle.Danger)
                  .setDisabled(true),
              )
            }
            disabledDeleteRows.push(row)
          }
          disabledAllRows.push(...disabledDeleteRows)
        }

        interaction
          .editReply({
            components: disabledAllRows,
          })
          .catch(() => {})
      })
    } else if (subcommand === "info") {
      const inviteInput = interaction.options.getString("code")
      const inviteCode = extractInviteCode(inviteInput)

      await interaction.deferReply()

      // Verify member status first
      await inviteTracker.verifyMemberStatus(client)

      // Aktualisiere den Einladungs-Cache
      await inviteTracker.refreshInvitesCache(client)

      const inviteInfo = await inviteTracker.getInviteInfo(client, inviteCode)

      if (!inviteInfo) {
        return interaction.editReply({
          content: `No information found for the invite with code \`${inviteCode}\`.`,
          ephemeral: true,
        })
      }

      const embed = new EmbedBuilder()
        .setColor(inviteTracker.config.embedColors.info)
        .setTitle(`${inviteTracker.config.embedTitles.info}: ${inviteCode}`)
        .setDescription(
          `**Invite code:** ${inviteCode}\n` +
            `**Server:** ${inviteInfo.guild ? inviteInfo.guild.name : "Unknown"}\n` +
            `**Channel:** <#${inviteInfo.channel.id}> (${inviteInfo.channel.name})\n` +
            `**Creator:** ${inviteInfo.creator ? `<@${inviteInfo.creator.id}> (${inviteInfo.activeCount}/${inviteInfo.uses} active invites)` : "Unknown"}\n` +
            `**Uses:** ${inviteInfo.uses}${inviteInfo.maxUses ? `/${inviteInfo.maxUses}` : ""}\n` +
            `**Created at:** <t:${Math.floor(new Date(inviteInfo.createdAt).getTime() / 1000)}:F>\n` +
            (inviteInfo.expiresAt
              ? `**Expires:** <t:${Math.floor(new Date(inviteInfo.expiresAt).getTime() / 1000)}:R>`
              : ""),
        )
        .setTimestamp()

      if (inviteTracker.config.embed.footer) {
        embed.setFooter({
          text: inviteTracker.config.embed.footer,
          iconURL: inviteTracker.config.embed.footerIconUrl,
        })
      }

      // Only add delete button if user has admin permissions
      const components = []
      if (hasAdminPerms) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`traceinvite_delete_info_${inviteCode}`)
            .setLabel("Delete Invite")
            .setStyle(ButtonStyle.Danger),
        )
        components.push(row)
      }

      const response = await interaction.editReply({
        embeds: [embed],
        components: components,
        ephemeral: false,
      })

      if (hasAdminPerms) {
        const collector = response.createMessageComponentCollector({
          time: 60000, // 1 minute timeout
        })

        collector.on("collect", async (i) => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: "You cannot use this button.", ephemeral: true })
          }

          const [action, type, info, code] = i.customId.split("_")

          if (type === "delete" && info === "info") {
            await i.deferUpdate({ ephemeral: true })

            try {
              console.log(`User ${i.user.tag} (${i.user.id}) is attempting to delete invite from info view: ${code}`)
              const success = await inviteTracker.deleteInvite(client, code)

              if (success) {
                const disabledRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`traceinvite_delete_info_${code}`)
                    .setLabel("Invite Deleted")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true),
                )

                await i.editReply({
                  components: [disabledRow],
                })

                await i.followUp({
                  content: `The invite with code \`${code}\` has been successfully deleted.`,
                  ephemeral: true,
                })
              } else {
                await i.followUp({
                  content: `Failed to delete invite with code \`${code}\`. The invite may no longer exist or the bot may not have permission to delete it.`,
                  ephemeral: true,
                })
              }
            } catch (error) {
              console.error(`Error handling delete button for invite ${code} in info view:`, error)
              await i.followUp({
                content: `An error occurred while trying to delete the invite with code \`${code}\`. Please try again later.`,
                ephemeral: true,
              })
            }
          }
        })

        collector.on("end", () => {
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`traceinvite_delete_info_${inviteCode}`)
              .setLabel("Delete Invite")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true),
          )

          interaction
            .editReply({
              components: [disabledRow],
            })
            .catch(() => {})
        })
      }
    } else if (subcommand === "user") {
      const targetUser = interaction.options.getUser("user") || interaction.user
      await interaction.deferReply()

      // Verify member status first
      await inviteTracker.verifyMemberStatus(client)

      // Aktualisiere den Einladungs-Cache
      await inviteTracker.refreshInvitesCache(client)

      const userInvites = inviteTracker.getUserInvites(targetUser.id)

      const embed = new EmbedBuilder()
        .setColor(inviteTracker.config.embedColors.info)
        .setTitle(`Invite Statistics for ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp()

      if (inviteTracker.config.embed.footer) {
        embed.setFooter({
          text: inviteTracker.config.embed.footer,
          iconURL: inviteTracker.config.embed.footerIconUrl,
        })
      }

      if (!userInvites || userInvites.invites.length === 0) {
        embed.setDescription(`${targetUser} has no tracked invites.`)
      } else {
        embed.setDescription(
          `**${targetUser}** has invited **${userInvites.totalUses}** members.\n` +
            `• **${userInvites.activeCount}** members are still in the server\n` +
            `• **${userInvites.leftCount}** members have left the server\n\n` +
            `**Active Invites:** ${userInvites.invites.length}`,
        )

        let invitesList = ""
        userInvites.invites.slice(0, 10).forEach((invite, index) => {
          invitesList +=
            `**${index + 1}.** \`${invite.code}\` - ${invite.uses} uses ` +
            `(${invite.activeCount}/${invite.uses} active)\n`
        })

        if (invitesList) {
          embed.addFields({ name: "Top Invites", value: invitesList })
        }

        if (userInvites.invites.length > 10) {
          embed.addFields({
            name: "Note",
            value: `Showing 10 out of ${userInvites.invites.length} invites. Use \`/traceinvite list\` to see all invites.`,
          })
        }
      }

      await interaction.editReply({
        embeds: [embed],
      })
    } else if (subcommand === "leaderboard") {
      await interaction.deferReply()

      // Verify member status first
      await inviteTracker.verifyMemberStatus(client)

      // Get all invites
      const allInvites = inviteTracker.getAllInvites()

      // Group invites by creator
      const inviterStats = new Map()

      allInvites.forEach((invite) => {
        if (invite.creator) {
          const creatorId = invite.creator.id
          if (!inviterStats.has(creatorId)) {
            inviterStats.set(creatorId, {
              id: creatorId,
              tag: invite.creator.tag,
              totalUses: 0,
              activeCount: 0,
              leftCount: 0,
              invites: [],
            })
          }

          const stats = inviterStats.get(creatorId)
          stats.totalUses += invite.uses
          stats.activeCount += invite.activeCount
          stats.leftCount += invite.leftCount
          stats.invites.push(invite)
        }
      })

      // Convert to array and sort by total uses
      const sortedInviters = [...inviterStats.values()].sort((a, b) => b.totalUses - a.totalUses).slice(0, 10) // Top 10

      const embed = new EmbedBuilder()
        .setColor(inviteTracker.config.embedColors.info)
        .setTitle("🏆 Invite Leaderboard")
        .setTimestamp()

      if (sortedInviters.length === 0) {
        embed.setDescription("No invite data found.")
      } else {
        let description = ""

        sortedInviters.forEach((inviter, index) => {
          description += `**${index + 1}.** <@${inviter.id}> - ${inviter.totalUses} invites (${inviter.activeCount}/${inviter.totalUses} active)\n`
        })

        embed.setDescription(description)
      }

      await interaction.editReply({
        embeds: [embed],
      })
    }
    // Füge die Implementierung für den refresh-Befehl hinzu
    else if (subcommand === "refresh") {
      // Only admins can refresh the invite cache
      if (!hasAdminPerms) {
        return interaction.reply({
          content: "You don't have permission to use this command. You need the 'Manage Server' permission.",
          ephemeral: true,
        })
      }

      await interaction.deferReply()

      try {
        await inviteTracker.refreshInvitesCache(client)
        return interaction.editReply({
          content: "✅ Successfully refreshed the invite cache for all guilds.",
          ephemeral: false,
        })
      } catch (error) {
        console.error("Error refreshing invite cache:", error)
        return interaction.editReply({
          content: "❌ An error occurred while refreshing the invite cache. Please check the console for details.",
          ephemeral: false,
        })
      }
    }
  },
}
