const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, EmbedBuilder, ChannelType } = require("discord.js")
const stickymessageModule = require("../../modules/stickymessage")
require('dotenv').config()
module.exports = {
  data: new SlashCommandBuilder()
    .setName("stickymessage")
    .setDescription("Create a sticky embed (minimal builder, English, purple)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  permissions: {
    user: [PermissionFlagsBits.ManageMessages],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: false,
  },
  cooldown: 10,
  async execute(interaction, client) {
    if (interaction.user.id !== process.env.ADMIN_ID) {
      return await interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true,
      })
    }
    
    let state = {
      title: "Sticky Title",
      description: "Sticky description goes here.",
      color: "#6f42c1",
      field1: "",
      field2: "",
      field3: "",
      field1Value: "",
      field2Value: "",
      field3Value: "",
      field1Inline: false,
      field2Inline: false,
      field3Inline: false,
      timestamp: true,
      selectedField: null,
      footerText: process.env.FOOTER_TEXT || "Created by @apt_start_latifi",
      footerIcon: process.env.EMBED_FOOTER_IMAGE_URL || "",
      imageUrl: ""
    }
    function buildEmbed() {
      const embed = new EmbedBuilder()
        .setTitle(state.title)
        .setDescription(state.description)
        .setColor(state.color)
        .setFooter({ text: state.footerText, iconURL: state.footerIcon || null })
      if (state.timestamp) embed.setTimestamp()
      const fields = []
      if (state.field1) fields.push({ name: state.field1, value: state.field1Value || "", inline: state.field1Inline })
      if (state.field2) fields.push({ name: state.field2, value: state.field2Value || "", inline: state.field2Inline })
      if (state.field3) fields.push({ name: state.field3, value: state.field3Value || "", inline: state.field3Inline })
      if (fields.length > 0) embed.addFields(fields)
      if (state.imageUrl) embed.setImage(state.imageUrl)
      return embed
    }
    function buildRows() {
      return [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("edit_title").setLabel("Edit Title").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("edit_description").setLabel("Edit Description").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("edit_color").setLabel("Edit Color").setStyle(ButtonStyle.Secondary),
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("edit_field1").setLabel("Edit Field 1").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("edit_field2").setLabel("Edit Field 2").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("edit_field3").setLabel("Edit Field 3").setStyle(ButtonStyle.Secondary),
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("edit_text_below").setLabel("Edit Text Below").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("toggle_inline").setLabel("Toggle Inline Field").setStyle(ButtonStyle.Secondary),
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("edit_footer").setLabel("Edit Footer").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("edit_footer_icon").setLabel("Edit Footer Icon").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("edit_image").setLabel("Edit Image/Banner").setStyle(ButtonStyle.Secondary),
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("toggle_timestamp").setLabel(`Timestamp: ${state.timestamp ? "On" : "Off"}`).setStyle(state.timestamp ? ButtonStyle.Success : ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("send_sticky").setLabel("Send Sticky").setStyle(ButtonStyle.Success),
        )
      ]
    }
    await interaction.reply({
      content: "**Sticky Embed Preview:**",
      embeds: [buildEmbed()],
      components: buildRows(),
      ephemeral: true
    })
    const msg = await interaction.fetchReply()
    const collector = msg.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 10 * 60 * 1000 })
    let collectorActive = true;
    const modalHandler = async (modalInt) => {
      if (!collectorActive) return; 
      if (!modalInt.isModalSubmit()) return;
      if (modalInt.user.id !== interaction.user.id) return;
      let acknowledged = false;
      try {
        if (modalInt.customId === "modal_title") {
          state.title = modalInt.fields.getTextInputValue("input")
        } else if (modalInt.customId === "modal_description") {
          state.description = modalInt.fields.getTextInputValue("input")
        } else if (modalInt.customId === "modal_color") {
          const val = modalInt.fields.getTextInputValue("input")
          state.color = /^#([0-9A-Fa-f]{6})$/.test(val) ? val : "#6f42c1"
        } else if (modalInt.customId === "modal_field1") {
          state.field1 = modalInt.fields.getTextInputValue("input")
        } else if (modalInt.customId === "modal_field2") {
          state.field2 = modalInt.fields.getTextInputValue("input")
        } else if (modalInt.customId === "modal_field3") {
          state.field3 = modalInt.fields.getTextInputValue("input")
        } else if (modalInt.customId === "modal_text_below") {
          if (state.selectedField) {
            state[state.selectedField + 'Value'] = modalInt.fields.getTextInputValue("input")
          }
        } else if (modalInt.customId === "modal_footer") {
          state.footerText = modalInt.fields.getTextInputValue("input")
        } else if (modalInt.customId === "modal_footer_icon") {
          state.footerIcon = modalInt.fields.getTextInputValue("input")
        } else if (modalInt.customId === "modal_image") {
          state.imageUrl = modalInt.fields.getTextInputValue("input")
        } else {
          return;
        }
        await modalInt.deferUpdate(); 
        acknowledged = true;
        await interaction.editReply({
          content: "**Sticky Embed Vorschau:**",
          embeds: [buildEmbed()],
          components: buildRows(),
        });
      } catch (error) {
        console.error("Fehler beim Verarbeiten des Sticky-Modal-Submits:", error);
        if (!acknowledged && !modalInt.replied && !modalInt.deferred) {
          try {
            await modalInt.reply({ content: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.", ephemeral: true });
          } catch (e) {
          }
        }
      }
    }
    client.on("interactionCreate", modalHandler)
    collector.on("end", () => {
      collectorActive = false;
      client.removeListener("interactionCreate", modalHandler)
    })
    collector.on("collect", async (i) => {
      async function showModal(customId, label, value, style = TextInputStyle.Short, required = true, maxLength = 1024) {
        const modal = new ModalBuilder()
          .setCustomId(customId)
          .setTitle(label)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("input")
                .setLabel(label)
                .setStyle(style)
                .setValue(value)
                .setRequired(required)
                .setMaxLength(maxLength)
            )
          )
        await i.showModal(modal)
      }
      if (i.customId === "edit_title") {
        await showModal("modal_title", "Edit Title", state.title, TextInputStyle.Short, true, 256)
      } else if (i.customId === "edit_description") {
        await showModal("modal_description", "Edit Description", state.description, TextInputStyle.Paragraph, true, 2048)
      } else if (i.customId === "edit_color") {
        const colorOptions = [
          { label: "Purple", value: "#6f42c1" },
          { label: "Discord Blue", value: "#5865F2" },
          { label: "Green", value: "#43B581" },
          { label: "Red", value: "#F04747" },
          { label: "Yellow", value: "#FAA61A" },
          { label: "Orange", value: "#FF5722" },
          { label: "Pink", value: "#E91E63" },
          { label: "Gray", value: "#95A5A6" },
          { label: "Black", value: "#23272A" },
          { label: "White", value: "#FFFFFF" },
        ]
        const colorSelectRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("sticky_color_select")
            .setPlaceholder("Select a color for the embed")
            .addOptions(colorOptions)
        )
        await i.update({
          content: "Select a color for the sticky embed:",
          embeds: [buildEmbed()],
          components: [colorSelectRow, ...buildRows().slice(1)],
          ephemeral: true
        })
      } else if (i.customId === "sticky_color_select") {
        state.color = i.values[0]
        await i.update({
          content: "**Sticky Embed Preview:**",
          embeds: [buildEmbed()],
          components: buildRows(),
          ephemeral: true
        })
      } else if (i.customId === "edit_field1") {
        state.selectedField = "field1"
        await showModal("modal_field1", "Edit Field 1 (will be used as field name)", state.field1, TextInputStyle.Short, false, 1024)
      } else if (i.customId === "edit_field2") {
        state.selectedField = "field2"
        await showModal("modal_field2", "Edit Field 2 (will be used as field name)", state.field2, TextInputStyle.Short, false, 1024)
      } else if (i.customId === "edit_field3") {
        state.selectedField = "field3"
        await showModal("modal_field3", "Edit Field 3 (will be used as field name)", state.field3, TextInputStyle.Short, false, 1024)
      } else if (i.customId === "edit_text_below") {
        if (!state.selectedField) {
          await i.update({ content: "Please select a field to edit first (Field 1, 2, or 3).", embeds: [buildEmbed()], components: buildRows(), ephemeral: true })
          return
        }
        const label = `Edit Text Below for ${state.selectedField.replace('field', 'Field ')}`
        const value = state[state.selectedField + 'Value'] || ""
        await showModal("modal_text_below", label, value, TextInputStyle.Paragraph, false, 1024)
      } else if (i.customId === "toggle_inline") {
        if (!state.selectedField) {
          await i.update({ content: "Please select a field to toggle inline (Field 1, 2, or 3).", embeds: [buildEmbed()], components: buildRows(), ephemeral: true })
          return
        }
        state[state.selectedField + 'Inline'] = !state[state.selectedField + 'Inline']
        await i.update({ content: "**Sticky Embed Preview:**", embeds: [buildEmbed()], components: buildRows(), ephemeral: true })
      } else if (i.customId === "edit_footer") {
        await showModal("modal_footer", "Edit Footer Text", state.footerText, TextInputStyle.Short, false, 256)
      } else if (i.customId === "edit_footer_icon") {
        await showModal("modal_footer_icon", "Edit Footer Icon URL", state.footerIcon, TextInputStyle.Short, false, 512)
      } else if (i.customId === "edit_image") {
        await showModal("modal_image", "Edit Image/Banner URL", state.imageUrl, TextInputStyle.Short, false, 1024)
      } else if (i.customId === "toggle_timestamp") {
        state.timestamp = !state.timestamp
        await i.update({ content: "**Sticky Embed Preview:**", embeds: [buildEmbed()], components: buildRows(), ephemeral: true })
      } else if (i.customId === "send_sticky") {
        if (interaction.user.id !== process.env.ADMIN_ID) {
          await i.update({
            content: "❌ Only the bot admin can set a sticky message, and only in this channel.",
            embeds: [],
            components: [],
            ephemeral: true
          })
          return
        }
        stickymessageModule.setSticky(interaction.channel.id, buildEmbed().toJSON())
        await stickymessageModule.resendSticky(interaction.channel, client)
        await i.update({
          content: `✅ Sticky embed has been set for <#${interaction.channel.id}>!`,
          embeds: [],
          components: [],
          ephemeral: true
        })
      }
    })
  },
} 