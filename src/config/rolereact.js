module.exports = {
    embedColor: "#71368A",
    title: "Verify!",
    channelId: "1149738704768868482",//Set in Discord with "/rolereact add" and "/rolereact send" your Roles and send Embed to Verify in Channel.
    //You can use {channelid:xxxxxx} to Ping a Channel in the Text. \n for new line
    description:
      "Welcome!\nHere you can accept your role! We are a large server and offer several things. Read {channelid:1277003322062143518} before Join our Community.\nFeel free to check our Channels!\n{channelid:1258008024694390888}, {channelid:1251916917698986074} ❤️", //Can add more Channels, just Link ChannelID with that format : {channelid:xxxxxxxxxxx}
    bannerUrl: "",
    thumbnailUrl: "",
    footerText: process.env.FOOTER_TEXT || "",
    footerIconUrl:  process.env.EMBED_FOOTER_IMAGE_URL  ||"",
    availableColors: [
      { name: "Blau", value: "blue" },
      { name: "Grün", value: "green" },
      { name: "Rot", value: "red" },
      { name: "Grau", value: "grey" },
    ],
  }
  