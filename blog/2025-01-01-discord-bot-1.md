---
slug: discord-bot-1
title: Creating a Discord Music Bot with discord.js and discord-player
authors: [om]
tags: [docusaurus]
---

### **Creating a Discord Music Bot with discord.js and discord-player**

Discord music bots are an engaging way to bring communities together by enabling music playback in voice channels. In this guide, we’ll explore how to build a feature-rich music bot using `discord.js` and `discord-player`.

<!-- truncate -->
---

## **Step 1: Setting Up the Bot**

1. **Register Your Bot**:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Create a new application, generate a bot token, and set permissions for `application.commands` and `bot`.

2. **Initialize the Project**:
   - Set up your project with Node.js (16 or above):
     ```bash
     npm init -y
     npm install discord.js discord-player ytdl-core ffmpeg
     ```
   - Create a `config.json` file to store your bot token and activity settings:
     ```json
     {
      "token": "YOUR_BOT_TOKEN",
      "activity": "your music selections",
      "activityType": "PLAYING",
      "authorUrl": "Image url",
      "authorId": "user id of your main account in case you want to give specific elevated priviledges to yourself"
     }
     ```

---

## **Step 2: Implementing Music Commands**

### **1. Create a Command Handler**
   Organize commands in a `./commands` folder and dynamically load them:
   ```js
     const fs = require('fs');
     const Discord = require('discord.js');

     //Permissions your bot will require in order to function properly
     const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] }); 

     client.commands = new Discord.Collection();

     //Here we are taking all files in commands directory ending with .js and importing the commands defined within, then setting them to the client commands collection.
     const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
     for (const file of commandFiles) {
       const command = require(`./commands/${file}`);
       client.commands.set(command.name, command);
     }
   ```

### **2. Set Up discord-player**
   Install and initialize `discord-player`:
   ```javascript
    const { Player } = require('discord-player');
    const player = new Player(client);

    //Here we listen to different events emitted and react accordingly. channel.send will output helpful messages to the music-channel where the event was emitted from. Various parameters like user, guild name, and channel can be accessed from the queue metadata.
    player.on('error', (queue, error) => {
      console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
    });
    
    //... more defined below
   ```

---

## **Step 3: Creating Music Commands**

### **1. Command Handler**
```js
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName.toLowerCase());

  try {
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
      return void interaction.reply({
        content: 'You are not in a voice channel!',
        ephemeral: true,
      });
    }

    if (
      interaction.guild.me.voice.channelId &&
      interaction.member.voice.channelId !== interaction.guild.me.voice.channelId
    ) {
      return void interaction.reply({
        content: 'You are not in my voice channel!',
        ephemeral: true,
      });
    }
    command.execute(interaction, player);
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: 'There was an error trying to execute that command!',
    });
  }
});
```

Here we ask the client to listen for interactions (commands). If a command is triggered, we execute some basic checks which are common across all of our music commands:

- Check if the user is inside a voice channel
- Check if user and your discord bot are in the same voice channel

We also do some basic error handling in case the command fails with interaction.followUp(). Setting ephemeral makes it so that only the executor of the command is able to see the interaction reply.

### **2. Play Command**
   Enable users to play music by providing a URL or search query:
  `./commands/play.js`
   ```javascript
module.exports = {
  name: 'play',
  description: 'Play a song in your channel!',
  options: [
    {
      name: 'query',
      type: 'STRING',
      description: 'The song you want to play',
      required: true,
    },
  ],
  async execute(interaction, player) {
    try {
      await interaction.deferReply();

      const query = interaction.options.get('query').value;
      const searchResult = await player
        .search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO,
        })
        .catch(() => {});
      if (!searchResult || !searchResult.tracks.length)
        return void interaction.followUp({content: 'No results were found!'});

      const queue = await player.createQueue(interaction.guild, {
        ytdlOptions: {
          quality: "highest",
          filter: "audioonly",
          highWaterMark: 1 << 25,
          dlChunkSize: 0,
        },
        metadata: {
          channel: interaction.channel,
          user: interaction.user
        }
      });

      try {
        if (!queue.connection) await queue.connect(interaction.member.voice.channel);
      } catch {
        void player.deleteQueue(interaction.guildId);
        return void interaction.followUp({
          content: 'Could not join your voice channel!',
        });
      }

      await interaction.followUp({
        content: `⏱ | Loading your ${searchResult.playlist ? 'playlist' : 'track'}...`,
      });
      searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
      if (!queue.playing) await queue.play();
    } catch (error) {
      console.log(error);
      interaction.followUp({
        content: 'There was an error trying to execute that command: ' + error.message,
      });
    }
  },
};
   ```

Lets try to break this down. Each command has a specific format. They have a name, description, optional parameters they can interact with, and an execute function. Name and description are shown in the commands menu when you start typing a spotify command. Once you start typing a command it will also start showing the parameters it accepts, both optional and required. 

The execute function is what we run when discord.client encounters a command. In the execute function, we make use of the interaction object and the player. Interaction gives us all the data about what we are interacting with. The discord server (guild) the command originated from, the user who queried it, the name of the channel, the voice channel the player is connected to, etc. It also provides capability to output follow up messages to the command.

The player is the instance of discord-player that we pass to the command. It takes care of querying the songs, creating a queue, deleting the queue, etc. It also listens to the events we defined for the player above like trackAdd, trackStart, etc and outputs messages to the channel signaling the same.

The player uses youtube downloader (ytdlOptions) to query the playlist or track. Both have been handled differently. Notice that I've added the metadata to this queue. This helps my discord player remember basic data about who queried the song and from where, which I use when listening to player events.

### **3. Queue Command**
   List all songs in the current queue:
   ```javascript
   module.exports = {
     name: 'queue',
     execute(interaction, player) {
       const queue = player.getQueue(interaction.guild);
       if (!queue) return interaction.reply('The queue is empty!');
       interaction.reply(queue.tracks.map((track, i) => `${i + 1}. ${track.title}`).join('\n'));
     },
   };
   ```

---

## **Step 4: Handling Events**

### **Bot Startup**
   Set the bot’s activity and handle ready events:
   ```javascript
   client.once('ready', () => {
     console.log('Bot is online!');
     client.user.setActivity(config.activity, { type: config.activityType });
   });
   ```

### **Player Events**
   Manage player-specific events like `trackStart` and `queueEnd`:
   ```javascript
    player.on('error', (queue, error) => {
      console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
    });

    player.on('connectionError', (queue, error) => {
      console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
    });

    player.on('trackStart', (queue, track) => {
      channel = queue.metadata.channel;
      user = queue.metadata.user;
      channel.send(
        `▶ | **${user.username}** Started playing: **${track.title}** in **${queue.connection.channel.name}**!`,
      );
    });

    player.on('trackAdd', (queue, track) => {
      channel = queue.metadata.channel;
      user = queue.metadata.user;
      channel.send(`🎶 | Track **${track.title}** queued by **${user.username}**!`);
    });

    player.on('botDisconnect', queue => {
      queue.metadata.channel.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
    });

    player.on('channelEmpty', queue => {
      queue.metadata.channel.send('❌ | Nobody is in the voice channel, leaving...');
      queue.destroy();
    });

    player.on('queueEnd', queue => {
      queue.metadata.channel.send('✅ | Queue finished!');
    });
   ```

---

## **Challenges and Solutions**

### **1. Voice Channel Management**
   Ensuring the bot joins and leaves voice channels correctly was key to avoid unnecessary resource usage.

### **2. Search Accuracy**
   Handling incorrect or vague user inputs for song queries required robust error handling.

---

## **Future Enhancements**
1. **Add Playlist Support**: Enable loading of YouTube or Spotify playlists.
2. **Slash Commands**: Transition to Discord’s modern interaction system.
3. **Volume Control**: Allow users to set playback volume.

By following this guide, you’ll have a working music bot that brings dynamic and engaging features to your Discord server.

---
