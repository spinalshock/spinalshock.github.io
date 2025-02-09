---
slug: discord-bot-2
title: Creating a Discord Music Bot with discord.js and discord-player
authors: [om]
tags: [docusaurus]
---

### **Blog 2: Building a Gym Record Bot with SQLite**

Along with listening to music with friends, I also used discord to share my latest Gym PRs and compete with friends. So I decided to extend the music bot to also have this capability. The basic usecase was integrate a database and maintain my personal lifts, along with lifts of my friends. In the future, a leaderboard can be created for each lift. 

<!-- truncate -->
---

## **Step 1: Setting Up the Bot**

1. **Setup the Dependencies**:
   ```bash
   npm install sqlite3 sequelize
   ```

2. **Configure the SQLite Database**:
   Create a `Records` utility to manage gym stats:
   ```js
    const Sequelize = require('sequelize');

    const sequelize = new Sequelize('database', 'username', 'password', {
        host: 'localhost',
        dialect: 'sqlite',
        logging: false,
        storage: './db/database.sqlite',
    });

    const Records = sequelize.define('records', {
        username: {
            type: Sequelize.STRING,
            unique: true,
        },
        bench: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        nbench: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        weight: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
    });

    module.exports = Records;
   ```

Above sample shows a simple table that holds username, weight, and bench press weight (bench) and reps (nbench). Can be similarly extended for all other exercises you perform. Note: This time, I'm making use of my bot's message reading capability instead of relying on bot commands. I'm keeping bot commands exclusively for music, and gym commands through normal messages, splitting the message into an initial command and accepted arguments. I hope you'll get a flavor for both ways of handling user input via a discord bot.

---

## **Step 2: Implementing Gym Commands**

> [!tip]
> MessageEmbed enables us to output good looking embedded discord messages
> We have to make sure that if a user does not exist in our database, we need to create them.
> In one setLift command we are handling setting of both bench press record as well as weight.
> Max is one rep max calculation, and tm is training max (90% of the calculated max). These are used in most popular weight lifting programs.
> Strength level is a simple function that checks max against bodyweight of the user, providing an estimated strength level of the user against global statistics.


### **1. Set a PR**
   Save a user’s personal best in the database:
   ```javascript
    const {MessageEmbed} = require('discord.js');
    const calculateStrengthLevel = require('./Strength.js');
    const config = require('../config.json');

    const setLift = (message, Records) => {
      const {
        id,
        avatar,
        username
      } = message.author;
      const msg = message.content;
      const args = msg.split(' ');
      const col = args[0].split('$set')[1];
      if (!["bench", "weight"].includes(col)) return message.reply('Please provide a valid command!');

      const isWeight = col == 'weight';

      if (isWeight) {
        if (args.length != 2) return message.reply('Incorrect usage!');
      }

      if (args.length > 3) return message.reply('Incorrect usage!');

      avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
      const newWeight = args[1];
      let ncol, newReps;
      if (!isWeight) {
        ncol = `n${col}`;
        newReps = args[2];
        if (!newWeight || !newReps) return message.reply(`Please provide ${col} [weight] [reps]!`);
      }
      Records.findOne({where: {username: username}})
        .then(record => {
          if (!record) {
            isWeight ? Records.create({username: username, [col]: newWeight}) : Records.create({username: username, [col]: newWeight, [ncol]: newReps});

            const max = Math.round(newWeight * newReps * 0.0333 + Number(newWeight));
            const tm = Math.round(max * 0.90);

            const messageToShow = new MessageEmbed()
              .setColor('#0099ff')
              .setTitle(`Setting ${username}'s ${col}:`)
              .setAuthor({name: 'Spi', iconURL: config.authorUrl, url: `${config.authorUrl}?size=1024`})
              .setDescription(isWeight ? `${newWeight} Kg` : `${newWeight} x ${newReps}`)
              .setThumbnail(`${avatarUrl}`);
            !isWeight && messageToShow
              .addField('Estimated 1RM', `${max} Kg`, true)
              .addField('Estimated TM', `${tm} Kg`, true);
            message.channel.send({embeds: [messageToShow]});
            return;
          }

          let oldWeight, oldReps;
          oldWeight = record[col];
          if (!isWeight) {
            oldReps = record[ncol];
          }

          const max = Math.round(newWeight * newReps * 0.0333 + Number(newWeight));
          const tm = Math.round(max * 0.90);
          let strengthLevel = "";
          if (!isWeight) {
            strengthLevel = calculateStrengthLevel(record, max, col);
          }

          if (isWeight) {
            record.update({[col]: newWeight})
              .then(() => {
                const messageToShow = new MessageEmbed()
                  .setColor('#0099ff')
                  .setTitle(`Updating ${username}'s ${col}:`)
                  .setAuthor({name: 'Spi', iconURL: config.authorUrl, url: `${config.authorUrl}?size=1024`})
                  .setDescription(`${oldWeight} -> ${newWeight}`)
                  .setThumbnail(`${avatarUrl}`);
                message.channel.send({embeds: [messageToShow]});
              })
              .catch(err => {
                message.reply('Something went wrong!');
                console.error(err);
              });
          } else {
            record.update({[col]: newWeight, [ncol]: newReps})
              .then(() => {
                const messageToShow = new MessageEmbed()
                  .setColor('#0099ff')
                  .setTitle(`Updating ${username}'s ${col}:`)
                  .setAuthor({name: 'Spi', iconURL: config.authorUrl, url: `${config.authorUrl}?size=1024`})
                  .setDescription(`${oldWeight} x ${oldReps} -> ${newWeight} x ${newReps}`)
                  .setThumbnail(`${avatarUrl}`)
                  .addField('Estimated 1RM', `${max} Kg`, true)
                  .addField('Estimated TM', `${tm} Kg`, true)
                  .addField('Strength Level', `${strengthLevel}`, true);
                message.channel.send({embeds: [messageToShow]});
              })
              .catch(err => {
                message.reply('Something went wrong!');
                console.error(err);
              });
          }
        })
        .catch(err => {
          message.reply('Something went wrong!');
          console.error(err);
        });
    };

    module.exports = setLift;
   ```

### **2. Retrieve a PR**
   Retrieve a specific lift info
   ```javascript
    const {MessageEmbed} = require('discord.js');
    const calculateStrengthLevel = require('./Strength.js');
    const config = require('../config.json');

    const getLift = (message, Records) => {
      const msg = message.content;
      const args = msg.split(' ');
      let username, id, avatar, avatarUrl;
      if (args.length > 1) {
        const first = message.mentions.members.first();
        username = first ? first.user.username : args[1];
        id = first ? first.user.id : "";
        avatar = first ? first.user.avatar : "";
      } else {
        const author = message.author;
        username = author.username;
        id = author.id;
        avatar = author.avatar;
      }
      if (!username) return message.reply('Please provide a username!');

      avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
        
      const col = args[0].split('$')[1];
      if (!["bench"].includes(col)) return message.reply('Please provide a valid command!'); //NOTE: bench is inside an array where you can similarly add any other gym lifts you are tracking.

      Records.findOne({where: {username: username}})
        .then(record => {
          if (!record) return message.reply('Could not find that user!');

          const max = Math.round(record[col] * record[`n${col}`] * 0.0333 + record[col]);
          const tm = Math.round(max * 0.90);
          const strengthLevel = calculateStrengthLevel(record, max, col);

          const messageToShow = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${username}'s ${col}:`)
            .setAuthor({name: 'Spi', iconURL: config.authorUrl, url: `${config.authorUrl}?size=1024`})
            .setDescription(`${record[col]} x ${record[`n${col}`]}`)
            .setThumbnail(`${avatarUrl}`)
            .addField('Estimated 1RM', `${max} Kg`, true)
            .addField('Estimated TM', `${tm} Kg`, true)
            .addField('Strength level', `${strengthLevel}`, true);
          message.channel.send({embeds: [messageToShow]});
        })
        .catch(err => {
          message.reply('Something went wrong!');
          console.error(err);
        });
    };

    module.exports = getLift;
   ```

### **3. Retrieve and show all PRs**
  Retrieve all lifts for a user in the database.

```js
  const { MessageEmbed } = require('discord.js');
  const config = require('../config.json');

  const getInfo = (message, Records) => {
    const msg = message.content;
    const args = msg.split(' ');
    let username, id, avatar, avatarUrl;
    if (args.length > 1) {
      const first = message.mentions.members.first();
      username = first ? first.user.username : args[1];
      id = first ? first.user.id : '';
      avatar = first ? first.user.avatar : '';
    } else {
      const author = message.author;
      username = author.username;
      id = author.id;
      avatar = author.avatar;
    }
    if (!username) return message.reply('Please provide a username!');

    avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;

    Records.findOne({ where: { username: username } })
      .then(record => {
        if (!record) {
          message.reply('Could not find that user!');
          return;
        }

        const messageToShow = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(username)
          .setAuthor({ name: 'Spi', iconURL: config.authorUrl, url: `${config.authorUrl}?size=1024` })
          .setDescription('Personal bests:')
          .setThumbnail(`${avatarUrl}`)
          .addField('Bench', `${record.bench} x ${record.nbench}`, true)
          // .addField('Incline Bench', `${record.inclinebench} x ${record.ninclinebench}`, true)
          // .addField('Deadlift', `${record.deadlift} x ${record.ndeadlift}`, true)
          // .addField('Hex Deadlift', `${record.hexdeadlift} x ${record.nhexdeadlift}`, true)
          // .addField('Sumo Deadlift', `${record.sumodeadlift} x ${record.nsumodeadlift}`, true)
          // .addField('OHP', `${record.ohp} x ${record.nohp}`, true)
          // .addField('Squat', `${record.squat} x ${record.nsquat}`, true)
          .addField('Weight', `${record.weight} Kg`, true);
        message.channel.send({ embeds: [messageToShow] });
      })
      .catch(err => {
        message.reply('Something went wrong!');
        console.error(err);
      });
  };

  module.exports = getInfo;
```
---

## **Step 3: Adding Utilities**

### **1. Conversion Commands**
   Provide unit conversion:
   ```javascript
   module.exports = {
     name: 'lbs',
     execute(message, args) {
       const weight = parseFloat(args[1]);
       message.reply(`${weight} Kg = ${(weight * 2.20462).toFixed(2)} lbs`);
     },
   };
   ```

### **2. Calculate One-Rep Max**
   Estimate a user’s one-rep max:
   ```javascript
   module.exports = {
     name: 'max',
     execute(message, args) {
       const [weight, reps] = args.slice(1);
       if (!weight || !reps) return message.reply('Provide weight and reps!');
       const orm = Math.round(weight * reps * 0.0333 + parseFloat(weight));
       message.reply(`Your one-rep max is: ${orm} Kg`);
     },
   };
   ```

---

## **Challenges and Solutions**

### **1. Data Validation**
   Ensuring inputs like `weight` and `reps` were valid integers required strict parsing and error handling.

### **2. Concurrency Issues**
   SQLite’s serialized operations prevented conflicts when multiple users accessed the database simultaneously.

---

## **Future Enhancements**

1. **Progress Tracking**: Show users graphs of their PR trends over time.
2. **Leaderboard**: Introduce a ranking system for gym stats.
3. **Web Integration**: Create a dashboard to visualize stored data.

This gym bot adds value by keeping users motivated and organized with their fitness goals while integrating seamlessly with Discord servers.

---
