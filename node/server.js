const Discord = require('discord.js');
const http = require('http');
const fs = require('fs');
const listFileName = './movieList.json';

const commands = {
  'add': addMovie,
  'list': showList,
  'remove': removeMovie,
  'vote': voteMovie,
}

require('dotenv').config();

const reactionArray = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];
const CHANNEL_ID = '827571407872589884';

let movieList = [];

const embedBase = new Discord.MessageEmbed()
  .setColor('#f5bc42')
  .setTitle('Current list:')
  .setAuthor('Beehive Movie List')
  // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
  .setTimestamp()

const client = new Discord.Client({
  partials: ['MESSAGE', 'REACTION', 'CHANNEL'],
});

client.login(process.env.BOT_TOKEN);


client.on('ready', () => {
  fs.readFile(listFileName, 'utf8', (err, data) => {
    if (err) {
      fs.writeFile(listFileName, JSON.stringify([]), () => { });
    }
    else {
      try {
        movieList = JSON.parse(data);
      }
      catch (err) {
        movieList = [];
      }
    }
  })
  console.log(commands);
})

const commandPrefix = '!movie ';

client.on('message', msg => {
  if (msg.author.bot) { return }
  if (!msg.content.startsWith(commandPrefix)) { return }
  if (msg.channel.id != CHANNEL_ID) { return }

  let commandBody = msg.content.substring(commandPrefix.length)
  commandBody = commandBody.toLowerCase();
  command = commandBody.split(' ')[0];
  commandInput = commandBody.substring(command.length + 1);

  if (commands[command] !== null) {
    commands[command](msg, commandInput);
  }
  else {
    msg.channel.send(`Invalid Command: ${command}`);
  }


  // for (let temp of commands) {
  // msg.channel.send(commands.toString());
  // }

  if (msg.content === 'Hello') {
    msg.channel.send('sup, ladies. My name\'s Slim Shady');
  }
});


function addMovie(msg, input) {
  msg.channel.send(`adding movie: ${input}`);
  for (let movie of movieList) {
    if (movie.name == input) {
      msg.channel.send(`Cannot add movie ${input}.  It's already on the list!`);
      return
    }
  }
  movieList.push({ name: input, votes: 0 });
  saveList();

  showList(msg.channel);
}

const filter = (reaction, user) => {
  return reactionArray.includes(reaction.emoji.name);
}

function voteMovie(msg) {
  voteList = buildVoteList();
  msg.channel.send(voteList)
    .then(() => {
      msg.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
        .then(collected => {
          msg.channel.send(`${collected.first().author} test`)
        })
        .catch(collected => {
          msg.channel.send('ran out of time');
        })
    });
}

function buildVoteList() {
  let voteListArr = [];
  let voteList = new Discord.MessageEmbed()
  .setColor('#f5bc42')
  .setTitle('Vote for a movie:')
  // .setAuthor('Beehive Movie List')
  // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
  const itemsPerPage = 5;

  for (let [idx, movie] of movieList.entries()) {
    voteListArr[Math.floor(idx / itemsPerPage)].addFields({name: `${reactionArray[idx]}`, value: `: ${movie.name}`});
  }

  return voteListArr;
}

function removeMovie(msg, input) {
  for (let [idx, movie] of movieList.entries()) {
    if (movie.name == input) {
      movieList.splice(idx, 1);
      break
    }
  }
  saveList();
  showList(msg.channel);
}

function saveList() {
  fs.writeFile(listFileName, JSON.stringify(movieList), () => { });
}

function showList(channel) {
  let newEmbed = new Discord.MessageEmbed(embedBase);

  movieList.forEach(movie => newEmbed.addFields({ name: movie.name, value: movie.votes }));

  channel.send(newEmbed);
}