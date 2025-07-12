module.exports = {
  // Rotation time in milliseconds (minimum: 5000 = 5 seconds)
  rotationInterval: 5000, // 5 Sekunden
  // Setting for welcoming new members in the status
  welcomeNewMembers: true, // Welcomes new members
  welcomeDuration: 30000, // How long the greeting is displayed (in milliseconds, default: 30 seconds)
  activities: [
    {
      text: "iddox.tech👾",
      type: "Playing", // Playing, Watching, Listening, Competing
      status: "online", // online, idle, dnd, invisible
    },
    {
      text: "LatifiMods",
      type: "Listening",
      status: "idle",
    },
    {
      text: "Created by @apt_start_latifi",
      type: "Watching",
      status: "dnd",
    },
    {
      text: ".gg/latifimods",
      type: "Competing",
      status: "online",
    },
    {
      text: "Watch my Tutorials",
      type: "Streaming",
      url: "https://www.youtube.com/watch?v=XSvfOTOA7EM", // Twitch-URL für Streaming
      status: "idle",
    },
    {
      text: "GRP Blacklist",
      type: "Streaming",
      url: "https://www.youtube.com/watch?v=JmyDVhWMIS0", // YouTube-URL für Streaming
      status: "dnd",
    },
  ],
  // Status-Description, Change nothing. 
  statusDescriptions: {
    online: "Online - Bot ist voll funktionsfähig",
    idle: "Abwesend - Bot könnte verzögert reagieren",
    dnd: "Bitte nicht stören - Bot führt wichtige Aufgaben aus",
    invisible: "Unsichtbar - Bot erscheint offline, funktioniert aber normal",
  },
}
