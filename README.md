<h1 align="center">NextBot 🤖✨</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Beta-blueviolet?style=flat-square&logo=github" alt="Beta Status" />
  <img src="https://img.shields.io/badge/Made%20with-Discord.js-7289DA?style=flat-square&logo=discord" alt="Discord.js" />
  <img src="https://img.shields.io/badge/Language-JavaScript-yellow?style=flat-square&logo=javascript" alt="JavaScript" />
  
</p>


---
## Over 28 usefull commands!
## 🚀 About NextBot

> **NextBot** is a modular, customizable Discord Bot providing advanced server management and interactive features.

Currently in **Beta** 🛠️ — under active development and testing!
## v0.1.2 Available now! [Download here!](https://github.com/IddoxLatifi/NextBot/releases/tag/v0.1.2)
## 🔄 Latest Updates & Improvements

### 📜 **Guild Logging added**
- **Event-Based Logging:** Automatically logs key server events like message deletions, edits, member joins/leaves, role updates, and more
- **Clean Log Embeds:** Professionally styled embeds with clear context and timestamps
- **User & Action Tracing:** Quickly trace actions to specific users for better moderation visibility

### 🎯 **New Sticky Message System**
- **Interactive Embed Builder:** Create beautiful sticky embeds with live preview
- **Button-Based Editing:** Easy-to-use interface with modal inputs for all embed elements
- **Auto-React Integration:** Sticky messages automatically receive configured auto-react emojis
- **Smart Message Management:** Automatically re-sends sticky messages to keep them at the bottom
- **Admin-Only Access:** Restricted to ADMIN_ID for security

### 🤖 **Enhanced AutoReact Module**
- **Bot Message Support:** Auto-react now works on bot messages and sticky messages
- **Robust Emoji Support:** Handles Unicode emojis, Discord custom emojis (animated/static), and server emojis
- **Improved Error Handling:** Better configuration management and error recovery
- **Admin-Only Commands:** All auto-react commands restricted to ADMIN_ID
- **Enhanced Logging:** Better debug information and error reporting

### 🛡️ **Security Improvements**
- **Admin ID Verification:** Critical commands now require ADMIN_ID authentication
- **Permission Checks:** Enhanced security for sensitive operations
- **Better Access Control:** Restricted access to configuration commands

### 🔧 **System Enhancements**
- **Improved Configuration Loading:** More robust data loading and error handling
- **Better Error Recovery:** Graceful fallbacks when configuration is corrupted
- **Enhanced Module Communication:** Better integration between sticky messages and auto-react

### 📋 **Advanced Guild Logging System**
- **Comprehensive Event Tracking:** Logs role changes, bans, kicks, mutes, channel creation/deletion, and member updates
- **Audit Log Integration:** Automatically detects who performed actions using Discord's audit logs
- **Detailed Log Embeds:** Rich embed format with executor information, target details, and before/after values
- **Configurable Logging:** Set custom log channels and customize embed colors for different event types

---

## v0.1.1 Available now! [Download here!](https://github.com/IddoxLatifi/NextBot/releases/tag/v0.1.1)

### 🎯 **Enhanced Ticket System**
- **Smart Transcript System:** Automatic transcript generation and DM delivery when tickets are deleted
- **Robust File Handling:** Prevents data corruption and ensures proper cleanup

### 📊 **New Livestats Module**
- **Real-time Server Statistics:** Automatic display of server metrics every 3 minutes
- **Comprehensive Data:** Members, Bots, Boosts, Channels, Roles, Emojis, and more
- **Fully Configurable:** All fields, colors, emojis, and update intervals customizable
- **Smart Message Management:** Updates existing embeds instead of spamming new ones

### 🛡️ **Welcome Module Improvements**
- **Rate Limiting:** Prevents spam welcome messages with configurable cooldowns
- **Enhanced Error Handling:** Better handling of missing channels and failed operations
- **Improved User Feedback:** Clear success/error messages and better logging

### 🔧 **System Enhancements**
- **Better Error Handling:** More robust error catching and user feedback
- **Improved Logging:** Enhanced debug information for easier troubleshooting

### 🎨 **UI/UX Improvements**
- **Improved Button Interactions:** More intuitive user interface
- **Better Status Messages:** Clear feedback for all user actions


---

🛡️ Features
---
## 🎟️ Ticket x Giveaway System
  - Create Random codes via DM that can be redeemed through the ticket system.

## 🚫 Anti-Spam & Anti-Invite Protection
  - Mutes or bans spammers/invite posters and deletes messages instantly.

## 🛠️ Moderation Tools

  - Ban 🔨

  - Kick 👢

  - Purge 🧹 (bulk-delete messages)

 ## 🖼️ Lifetime Embed Creator
 
  - Create and manage beautiful, persistent embeds easily.

  ##  👻 Anti-Ghost Ping Detection
  
  - Detects and alerts ghost pings.

  ## 🎭 Role Reaction System
  
  - Assign roles by emoji reactions.

  ## 👋 Welcome Module
  
  - Welcome new users with style!

  ## ⭐ Rating System
  
  - Collect and calculate average ratings.

  ## 🏰 Server Info Command
  
  - Quick overview of server details.

  ## 🔍 /traceInvite Command
  
  - Track and manage invite links for better insight and control.

  ## 🧲 /stealEmoji Module

  - Easily import emojis from other servers to your own.

## ⚙️ Configuration

> All modules are configurable via the `/src/config/` folder.

Default configuration example:

```javascript
footer: process.env.EMBED_FOOTER_TEXT || "Powered by @apt_start_latifi | shop.iddox.tech", //If you put Text between "", 
//the Script load the Text. Same with the Footer URL. 
footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
```
<div align="center">
  <h1>🚀 NextBot Installation Guide</h1>
  <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzl4em96eGtmajJwdGs2dTd2czc5bTFoaGE1Ymk1MDdkanJjNnU3cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kdiLau77NE9Z8vxGSO/giphy.gif" width="200" alt="Rocket launch">
</div>

## 📥 Clone the Repository
<pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto">
git clone https://github.com/IddoxLatifi/NextBot.git
cd NextBot
</pre>

## ⚙️ Environment Configuration
1. Rename the example file:
   <pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto">mv .env.example .env</pre>
2. Edit the configuration:
   <pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto">nano .env</pre>

## 📦 Dependency Installation
### Standard Installation
<pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto">npm install</pre>

### Alternative (if issues occur)
<pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto">npm install --legacy-peer-deps</pre>

## 🚀 Launch Sequence
1. Deploy commands:
   <pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto">node deploy-commands.js</pre>
2. Start the bot:
   <pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto">node index.js</pre>

🎥 Setup Tutorial (YouTube)
<div align="center"> <a href="https://www.youtube.com/watch?v=6yVzCuFDz9k" target="_blank"> <img src="https://img.youtube.com/vi/6yVzCuFDz9k/0.jpg" alt="NextBot YouTube Tutorial" style="width:80%; border-radius:10px;"> <br /> <strong>Watch the full setup guide on YouTube</strong> </a> </div>

<div align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWluM24xaDliMWw4azRscGM5Nnk3bzQ2dXNiOXpwaWJ6bWxtZHl4biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CjmvTCZf2U3p09Cn0h/giphy.gif" width="150" alt="Celebration">
  <p><strong>Your NextBot is now ready!</strong></p>
</div>


## 🎨 Customization Features
✅ **One-Time Setup**:
- Fully customizable configuration
- Easy-to-edit modules
- Works with all major hosting services




If not customized, default settings are taken from your .env file.
🗂️ Data Management

NextBot uses structured JSON files for storing:

    🎟️ Ticket data

    ⭐ Ratings

    🎉 Giveaway entries

    💤 AFK System

<div align="center">
  <h1>🚧 NextBot Development Status</h1>
  <p><strong>NextBot is currently in active <span style="color:orange">Beta Phase</span>!</strong></p>
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXVqYmsyMzA3emNnNG9qZW92MnIwNGI2eDJsMjVlcXpvaHpkdjNiZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/78XCFBGOlS6keY1Bil/giphy.gif" width="150" alt="Robot waving" />
</div>

## 🔥 What to Expect
- Regular updates and improvements
- New features being added frequently
- Potential breaking changes during beta

## 📢 We Need Your Help!
Your feedback is invaluable to us! Please:
- 🐛 [Report bugs on GitHub](https://github.com/IddoxLatifi/NextBot/issues)
- 💡 Suggest new features
- ✨ Share your experience

## 💬 Support Channels
| Platform       | Link                                                      |
|----------------|-----------------------------------------------------------|
| GitHub Issues  | [Open an Issue](https://github.com/IddoxLatifi/NextBot/issues) |
| Discord        | [Join our Support Server](https://discord.gg/KcuMUUAP5T)  |

## 🧩 Tech Stack
```bash
├── Node.js 🟢 - Runtime Environment
├── Discord.js 💙 - Discord API Library
└── dotenv 🌱 - Environment Configuration
```
📜 License

    © 2025 NextBot @apt_start_latifi
    Licensed under the GPL v3 License.

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-green.svg)](https://opensource.org/licenses/) 

<h2 align="left">I code with</h2>

<div align="left">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" height="40" alt="javascript logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" height="40" alt="docker logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" height="40" alt="python logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visualstudio/visualstudio-plain.svg" height="40" alt="visualstudio logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" height="40" alt="css3 logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" height="40" alt="git logo"  />
  <img width="12" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg" height="40" alt="rust logo"  />
</div>

<div align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=IddoxLatifi&hide_title=false&hide_rank=false&show_icons=true&include_all_commits=true&count_private=true&disable_animations=false&theme=dracula&locale=en&hide_border=false&order=1" height="150" alt="stats graph"  />
  <img src="https://github-readme-stats.vercel.app/api/top-langs?username=IddoxLatifi&locale=en&hide_title=false&layout=compact&card_width=320&langs_count=5&theme=dracula&hide_border=false&order=2" height="150" alt="languages graph"  />
</div>
