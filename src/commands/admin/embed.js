const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
const {SlashCommandBuilder,PermissionFlagsBits,ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType,StringSelectMenuBuilder,ModalBuilder,TextInputBuilder,TextInputStyle,EmbedBuilder,} = 
require("discord.js")
const stickymessageModule = require("../../modules/stickymessage")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Creates an interactive embed with preview and editing options"),
  permissions: {
    user: [PermissionFlagsBits.ManageMessages],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: false,
  },
  cooldown: 10,
  async execute(interaction, client, options = {}) {
    const stickyMode = options.stickyMode || false
    const embedsData = [
      {
        title: "Embed Title",
        description: "Embed Description",
        color: "#5865F2",
        fields: [],
        footer: {
          text: process.env.FOOTER_TEXT || "",
          iconURL: process.env.EMBED_FOOTER_IMAGE_URL || null,
        },
        timestamp: true,
        author: {
          name: "",
          iconURL: "",
        },
        thumbnail: "",
        image: "",
      },
    ]
    let messageContent = ""
    let currentEmbedIndex = 0
    let selectedChannelId = null
    function createEmbed(data) {
      const embed = new EmbedBuilder()
      if (data.title) embed.setTitle(data.title)
      if (data.description) embed.setDescription(data.description)
      embed.setColor(data.color || "#5865F2")
      if (data.fields && data.fields.length > 0) {
        embed.addFields(data.fields)
      }
      if (data.footer) {
        embed.setFooter({
          text: data.footer.text || "Footer Text",
          iconURL: data.footer.iconURL || null,
        })
      }
      if (data.timestamp) {
        embed.setTimestamp()
      }
      if (data.author && data.author.name) {
        embed.setAuthor({
          name: data.author.name,
          iconURL: data.author.iconURL || null,
        })
      }
      if (data.thumbnail) {
        embed.setThumbnail(data.thumbnail)
      }
      if (data.image) {
        embed.setImage(data.image)
      }
      return embed
    }
    function createActionRows() {
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("embed_edit_title").setLabel("Title").setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("embed_edit_description")
          .setLabel("Description")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("embed_edit_color").setLabel("Color").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("embed_edit_author").setLabel("Author").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("embed_edit_footer").setLabel("Footer").setStyle(ButtonStyle.Primary),
      )
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("embed_edit_thumbnail").setLabel("Thumbnail").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("embed_edit_image").setLabel("Image").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("embed_add_field").setLabel("Add Field").setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("embed_toggle_timestamp")
          .setLabel(embedsData[currentEmbedIndex].timestamp ? "Timestamp Off" : "Timestamp On")
          .setStyle(embedsData[currentEmbedIndex].timestamp ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("embed_edit_content")
          .setLabel("Text Above Embed")
          .setStyle(ButtonStyle.Secondary),
      )
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("embed_add_new")
          .setLabel("New Embed")
          .setStyle(ButtonStyle.Success)
          .setDisabled(embedsData.length >= 5), // Max 5 Embeds
        new ButtonBuilder()
          .setCustomId("embed_remove")
          .setLabel("Delete Embed")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(embedsData.length <= 1), // At least 1 Embed
        new ButtonBuilder()
          .setCustomId("embed_previous")
          .setLabel("◀️ Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(embedsData.length <= 1 || currentEmbedIndex === 0),
        new ButtonBuilder()
          .setCustomId("embed_next")
          .setLabel("Next ▶️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(embedsData.length <= 1 || currentEmbedIndex === embedsData.length - 1),
        new ButtonBuilder()
          .setCustomId("embed_manage_fields")
          .setLabel("Manage Fields")
          .setStyle(ButtonStyle.Secondary),
      )
      const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("embed_send").setLabel("Send").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("embed_select_channel").setLabel("Select Channel").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("embed_cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger),
      )
      return [row1, row2, row3, row4]
    }
    const embed = createEmbed(embedsData[currentEmbedIndex])
    const message = await interaction.reply({
      content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
      embeds: [embed],
      components: createActionRows(),
      ephemeral: true,
      fetchReply: true,
    })
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 900000, // 15 minutes
    })
    collector.on("collect", async (i) => {
      switch (i.customId) {
        case "embed_edit_title":
          const titleModal = new ModalBuilder()
            .setCustomId("embed_modal_title")
            .setTitle("Edit Title")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("title")
                  .setLabel("Title")
                  .setStyle(TextInputStyle.Short)
                  .setValue(embedsData[currentEmbedIndex].title || "")
                  .setMaxLength(256)
                  .setRequired(true),
              ),
            )
          await i.showModal(titleModal)
          break
        case "embed_edit_description":
          const descriptionModal = new ModalBuilder()
            .setCustomId("embed_modal_description")
            .setTitle("Edit Description")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("description")
                  .setLabel("Description")
                  .setStyle(TextInputStyle.Paragraph)
                  .setValue(embedsData[currentEmbedIndex].description || "")
                  .setMaxLength(4000)
                  .setRequired(true),
              ),
            )
          await i.showModal(descriptionModal)
          break
        case "embed_edit_color":
          const colorRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("embed_select_color")
              .setPlaceholder("Choose a color")
              .addOptions([
                { label: "Discord Blue", value: "#5865F2" },
                { label: "Discord Green", value: "#43B581" },
                { label: "Discord Red", value: "#F04747" },
                { label: "Discord Yellow", value: "#FAA61A" },
                { label: "Purple", value: "#9B59B6" },
                { label: "Pink", value: "#E91E63" },
                { label: "Orange", value: "#FF5722" },
                { label: "Turquoise", value: "#00BCD4" },
                { label: "Light Blue", value: "#3498DB" },
                { label: "Dark Blue", value: "#1F3A93" },
                { label: "Light Green", value: "#2ECC71" },
                { label: "Dark Green", value: "#27AE60" },
                { label: "Light Red", value: "#E74C3C" },
                { label: "Dark Red", value: "#C0392B" },
                { label: "Gold", value: "#F1C40F" },
                { label: "Brown", value: "#8B4513" },
                { label: "Gray", value: "#95A5A6" },
                { label: "Dark Gray", value: "#7F8C8D" },
                { label: "Black", value: "#2C3E50" },
                { label: "White", value: "#FFFFFF" },
              ]),
          )
          await i.update({
            content: `**Choose a color for your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
            components: [colorRow],
          })
          break
        case "embed_edit_author":
          const authorModal = new ModalBuilder()
            .setCustomId("embed_modal_author")
            .setTitle("Edit Author")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("author_name")
                  .setLabel("Author Name")
                  .setStyle(TextInputStyle.Short)
                  .setValue(embedsData[currentEmbedIndex].author?.name || "")
                  .setMaxLength(256)
                  .setRequired(false),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("author_icon")
                  .setLabel("Author Icon URL")
                  .setStyle(TextInputStyle.Short)
                  .setValue(embedsData[currentEmbedIndex].author?.iconURL || "")
                  .setMaxLength(1000)
                  .setRequired(false),
              ),
            )
          await i.showModal(authorModal)
          break
        case "embed_edit_footer":
          const footerModal = new ModalBuilder()
            .setCustomId("embed_modal_footer")
            .setTitle("Edit Footer")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("footer_text")
                  .setLabel("Footer Text")
                  .setStyle(TextInputStyle.Short)
                  .setValue(embedsData[currentEmbedIndex].footer?.text || "")
                  .setMaxLength(2048)
                  .setRequired(false),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("footer_icon")
                  .setLabel("Footer Icon URL")
                  .setStyle(TextInputStyle.Short)
                  .setValue(embedsData[currentEmbedIndex].footer?.iconURL || "")
                  .setMaxLength(1000)
                  .setRequired(false),
              ),
            )
          await i.showModal(footerModal)
          break
        case "embed_edit_thumbnail":
          const thumbnailModal = new ModalBuilder()
            .setCustomId("embed_modal_thumbnail")
            .setTitle("Edit Thumbnail")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("thumbnail")
                  .setLabel("Thumbnail URL")
                  .setStyle(TextInputStyle.Short)
                  .setValue(embedsData[currentEmbedIndex].thumbnail || "")
                  .setMaxLength(1000)
                  .setRequired(false),
              ),
            )
          await i.showModal(thumbnailModal)
          break
        case "embed_edit_image":
          const imageModal = new ModalBuilder()
            .setCustomId("embed_modal_image")
            .setTitle("Edit Image")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("image")
                  .setLabel("Image URL")
                  .setStyle(TextInputStyle.Short)
                  .setValue(embedsData[currentEmbedIndex].image || "")
                  .setMaxLength(1000)
                  .setRequired(false),
              ),
            )
          await i.showModal(imageModal)
          break
        case "embed_add_field":
          const fieldModal = new ModalBuilder()
            .setCustomId("embed_modal_field")
            .setTitle("Add Field")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("field_name")
                  .setLabel("Field Name")
                  .setStyle(TextInputStyle.Short)
                  .setMaxLength(256)
                  .setRequired(true),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("field_value")
                  .setLabel("Field Value")
                  .setStyle(TextInputStyle.Paragraph)
                  .setMaxLength(1024)
                  .setRequired(true),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("field_inline")
                  .setLabel("Inline? (true/false)")
                  .setStyle(TextInputStyle.Short)
                  .setValue("true")
                  .setMaxLength(5)
                  .setRequired(true),
              ),
            )
          await i.showModal(fieldModal)
          break
        case "embed_toggle_timestamp":
          embedsData[currentEmbedIndex].timestamp = !embedsData[currentEmbedIndex].timestamp
          const updatedEmbed = createEmbed(embedsData[currentEmbedIndex])
          await i.update({
            content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
            embeds: [updatedEmbed],
            components: createActionRows(),
          })
          break
        case "embed_edit_content":
          const contentModal = new ModalBuilder()
            .setCustomId("embed_modal_content")
            .setTitle("Edit text above the embed")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("content")
                  .setLabel("Text (e.g. for mentions)")
                  .setStyle(TextInputStyle.Paragraph)
                  .setValue(messageContent || "")
                  .setMaxLength(2000)
                  .setRequired(false),
              ),
            )
          await i.showModal(contentModal)
          break
        case "embed_add_new":
          if (embedsData.length < 5) {
            const newEmbed = JSON.parse(JSON.stringify(embedsData[currentEmbedIndex]))
            newEmbed.title = `Embed Title ${embedsData.length + 1}`
            newEmbed.description = `Embed Description ${embedsData.length + 1}`
            newEmbed.fields = []
            embedsData.push(newEmbed)
            currentEmbedIndex = embedsData.length - 1
            const newEmbedPreview = createEmbed(embedsData[currentEmbedIndex])
            await i.update({
              content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
              embeds: [newEmbedPreview],
              components: createActionRows(),
            })
          }
          break
        case "embed_remove":
          if (embedsData.length > 1) {
            embedsData.splice(currentEmbedIndex, 1)
            currentEmbedIndex = Math.min(currentEmbedIndex, embedsData.length - 1)
            const remainingEmbed = createEmbed(embedsData[currentEmbedIndex])
            await i.update({
              content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
              embeds: [remainingEmbed],
              components: createActionRows(),
            })
          }
          break
        case "embed_previous":
          if (currentEmbedIndex > 0) {
            currentEmbedIndex--
            const prevEmbed = createEmbed(embedsData[currentEmbedIndex])
            await i.update({
              content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
              embeds: [prevEmbed],
              components: createActionRows(),
            })
          }
          break
        case "embed_next":
          if (currentEmbedIndex < embedsData.length - 1) {
            currentEmbedIndex++
            const nextEmbed = createEmbed(embedsData[currentEmbedIndex])
            const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
            await i.update({
              content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
              embeds: [nextEmbed],
              components: createActionRows(),
            })
          }
          break
        case "embed_manage_fields":
          const fields = embedsData[currentEmbedIndex].fields || []
          if (fields.length === 0) {
            await i.update({
              content: `**This embed has no fields yet. Add fields with "Add Field".**`,
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId("embed_back_to_main")
                    .setLabel("Back")
                    .setStyle(ButtonStyle.Secondary),
                ),
              ],
            })
            break
          }
          const fieldOptions = fields.map((field, index) => ({
            label: field.name.length > 25 ? field.name.substring(0, 22) + "..." : field.name,
            value: index.toString(),
            description: `Field ${index + 1}${field.inline ? " (inline)" : ""}`,
          }))
          const fieldRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("embed_select_field")
              .setPlaceholder("Select a field to edit or delete")
              .addOptions(fieldOptions),
          )
          const fieldActionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("embed_back_to_main").setLabel("Back").setStyle(ButtonStyle.Secondary),
          )
          await i.update({
            content: `**Manage the fields of your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
            components: [fieldRow, fieldActionRow],
          })
          break
        case "embed_back_to_main":
          const currentEmbed = createEmbed(embedsData[currentEmbedIndex])
          await i.update({
            content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
            embeds: [currentEmbed],
            components: createActionRows(),
          })
          break
        case "embed_select_channel":
          const channels = interaction.guild.channels.cache
            .filter((channel) => channel.type === ChannelType.GuildText)
            .sort((a, b) => a.position - b.position)
            .map((channel) => ({
              label: channel.name,
              value: channel.id,
              description: `#${channel.name}`,
            }))
          const channelRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("embed_select_channel_id")
              .setPlaceholder("Select a channel")
              .addOptions(channels.slice(0, 25)),
          )
          await i.update({
            content: "**Select a channel to send the embed to:**",
            components: [channelRow],
          })
          break
        case "embed_select_channel_id":
          selectedChannelId = i.values[0]
          const selectedChannel = interaction.guild.channels.cache.get(selectedChannelId)
          await i.update({
            content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}) - will be sent to #${selectedChannel.name}:**`,
            embeds: [createEmbed(embedsData[currentEmbedIndex])],
            components: createActionRows(),
          })
          break
        case "embed_select_color":
          embedsData[currentEmbedIndex].color = i.values[0]
          await i.update({
            content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
            embeds: [createEmbed(embedsData[currentEmbedIndex])],
            components: createActionRows(),
          })
          break
        case "embed_select_field":
          const selectedFieldIndex = i.values[0]
          const selectedField = embedsData[currentEmbedIndex].fields[selectedFieldIndex]
          const editFieldModal = new ModalBuilder()
            .setCustomId(`embed_modal_edit_field_${selectedFieldIndex}`)
            .setTitle("Edit Field")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("field_name")
                  .setLabel("Field Name")
                  .setStyle(TextInputStyle.Short)
                  .setValue(selectedField.name)
                  .setMaxLength(256)
                  .setRequired(true),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("field_value")
                  .setLabel("Field Value")
                  .setStyle(TextInputStyle.Paragraph)
                  .setValue(selectedField.value)
                  .setMaxLength(1024)
                  .setRequired(true),
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("field_inline")
                  .setLabel("Inline? (true/false)")
                  .setStyle(TextInputStyle.Short)
                  .setValue(selectedField.inline.toString())
                  .setMaxLength(5)
                  .setRequired(true),
              ),
            )
          await i.showModal(editFieldModal)
          break
        case "embed_send":
          if (stickyMode) {
            // Prompt for channel selection
            const channelSelectRow = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("sticky_select_channel")
                .setPlaceholder("Select a channel for the sticky embed")
                .addOptions(
                  interaction.guild.channels.cache
                    .filter((c) => c.isTextBased() && c.viewable && c.type === ChannelType.GuildText)
                    .map((c) => ({ label: c.name, value: c.id }))
                )
            )
            await i.update({
              content: "Select the channel where the sticky embed should be set:",
              embeds: [],
              components: [channelSelectRow],
              ephemeral: true,
            })
            // Wait for channel selection
            const filter = (selectInt) => selectInt.user.id === interaction.user.id && selectInt.customId === "sticky_select_channel"
            const selectCollector = i.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 })
            selectCollector.on("collect", async (selectInt) => {
              await selectInt.deferUpdate()
              const channelId = selectInt.values[0]
              stickymessageModule.setSticky(channelId, embedsData[currentEmbedIndex])
              await interaction.followUp({ content: `✅ Sticky embed has been set for <#${channelId}>!`, ephemeral: true })
            })
            return
          }
          const targetChannel = selectedChannelId
            ? interaction.guild.channels.cache.get(selectedChannelId)
            : interaction.channel
          if (!targetChannel) {
            await i.update({
              content: "❌ The selected channel no longer exists.",
              components: [],
            })
            collector.stop()
            return
          }
          try {
            const allEmbeds = embedsData.map((data) => createEmbed(data))
            await targetChannel.send({
              content: messageContent || null,
              embeds: allEmbeds,
            })
            await i.update({
              content: `✅ Your ${embedsData.length} embeds have been successfully sent to ${targetChannel}!`,
              embeds: [],
              components: [],
            })
            collector.stop()
          } catch (error) {
            console.error("Error sending embeds:", error)
            await i.update({
              content: "❌ An error occurred while sending the embeds.",
              components: [],
            })
            collector.stop()
          }
          break
        case "embed_cancel":
          await i.update({
            content: "❌ Embed creation cancelled.",
            embeds: [],
            components: [],
          })
          collector.stop()
          break
        default:
          if (i.customId.startsWith("embed_edit_selected_field_")) {
            const fieldIndex = Number.parseInt(i.customId.split("_").pop())
            const field = embedsData[currentEmbedIndex].fields[fieldIndex]
            const editFieldModal = new ModalBuilder()
              .setCustomId(`embed_modal_edit_field_${fieldIndex}`)
              .setTitle("Edit Field")
              .addComponents(
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                    .setCustomId("field_name")
                    .setLabel("Field Name")
                    .setStyle(TextInputStyle.Short)
                    .setValue(field.name)
                    .setMaxLength(256)
                    .setRequired(true),
                ),
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                    .setCustomId("field_value")
                    .setLabel("Field Value")
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(field.value)
                    .setMaxLength(1024)
                    .setRequired(true),
                ),
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                    .setCustomId("field_inline")
                    .setLabel("Inline? (true/false)")
                    .setStyle(TextInputStyle.Short)
                    .setValue(field.inline.toString())
                    .setMaxLength(5)
                    .setRequired(true),
                ),
              )

            await i.showModal(editFieldModal)
          }
          else if (i.customId.startsWith("embed_delete_selected_field_")) {
            const fieldIndex = Number.parseInt(i.customId.split("_").pop())
            embedsData[currentEmbedIndex].fields.splice(fieldIndex, 1)
            const updatedEmbed = createEmbed(embedsData[currentEmbedIndex])
            await i.update({
              content: `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
              embeds: [updatedEmbed],
              components: createActionRows(),
            })
          }
          break
      }
    })
    const modalHandler = async (interaction) => {
      if (!interaction.isModalSubmit()) return
      if (!interaction.customId.startsWith("embed_modal_")) return
      if (interaction.user.id !== interaction.user.id) return
      try {
        if (interaction.customId === "embed_modal_title") {
          embedsData[currentEmbedIndex].title = interaction.fields.getTextInputValue("title")
        } else if (interaction.customId === "embed_modal_description") {
          embedsData[currentEmbedIndex].description = interaction.fields.getTextInputValue("description")
        } else if (interaction.customId === "embed_modal_author") {
          embedsData[currentEmbedIndex].author = {
            name: interaction.fields.getTextInputValue("author_name"),
            iconURL: interaction.fields.getTextInputValue("author_icon"),
          }
        } else if (interaction.customId === "embed_modal_footer") {
          embedsData[currentEmbedIndex].footer = {
            text: interaction.fields.getTextInputValue("footer_text"),
            iconURL: interaction.fields.getTextInputValue("footer_icon"),
          }
        } else if (interaction.customId === "embed_modal_thumbnail") {
          embedsData[currentEmbedIndex].thumbnail = interaction.fields.getTextInputValue("thumbnail")
        } else if (interaction.customId === "embed_modal_image") {
          embedsData[currentEmbedIndex].image = interaction.fields.getTextInputValue("image")
        } else if (interaction.customId === "embed_modal_field") {
          const fieldName = interaction.fields.getTextInputValue("field_name")
          const fieldValue = interaction.fields.getTextInputValue("field_value")
          const fieldInline = interaction.fields.getTextInputValue("field_inline").toLowerCase() === "true"

          if (!embedsData[currentEmbedIndex].fields) embedsData[currentEmbedIndex].fields = []
          embedsData[currentEmbedIndex].fields.push({
            name: fieldName,
            value: fieldValue,
            inline: fieldInline,
          })
        } else if (interaction.customId === "embed_modal_content") {
          messageContent = interaction.fields.getTextInputValue("content")
        } else if (interaction.customId.startsWith("embed_modal_edit_field_")) {
          const fieldIndex = Number.parseInt(interaction.customId.split("_").pop())
          embedsData[currentEmbedIndex].fields[fieldIndex] = {
            name: interaction.fields.getTextInputValue("field_name"),
            value: interaction.fields.getTextInputValue("field_value"),
            inline: interaction.fields.getTextInputValue("field_inline").toLowerCase() === "true",
          }
        }
        const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
        const updatedEmbed = createEmbed(embedsData[currentEmbedIndex])
        await interaction.deferUpdate()
        await interaction.editReply({
          content: selectedChannelId
            ? `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}) - will be sent to #${
                interaction.guild.channels.cache.get(selectedChannelId).name
              }:**`
            : `**Edit your embed (${currentEmbedIndex + 1}/${embedsData.length}):**`,
          embeds: [updatedEmbed],
          components: createActionRows(),
        })
      } catch (error) {
        console.error("Error handling modal submit:", error)
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "An error occurred. Please try again.",
              ephemeral: true,
            })
          }
        } catch (e) {
          console.error("Error sending error message:", e)
        }
      }
    }
    client.on("interactionCreate", modalHandler)
    collector.on("end", () => {
      client.removeListener("interactionCreate", modalHandler)
    })
    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        try {
          interaction
            .editReply({
              content: "⏱️ The time for embed creation has expired.",
              components: [],
              embeds: [],
            })
            .catch(console.error)
        } catch (error) {
          console.error("Error updating message after timeout:", error)
        }
      }
    })
  },
}