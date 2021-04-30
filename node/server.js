const Discord = require('discord.js');
const http = require('http');
const fs = require('fs');
const listFileName = './movieList.json';
const adminFileName = './adminList.json';
const watchedListFileName = './watchedList.json';

// https://discord.com/api/oauth2/authorize?client_id=826203543442685962&permissions=3221564480&scope=bot

const commands = {
  'add': addMovie,
  'list': showList,
  'remove': removeMovie,
  'vote': voteMovie,
  'unvote': unvote,
  'addadmin': addAdmin,
  'deladmin': delAdmin,
  'help': help,
  'watch': watchMovie,
  'watchedlist': showWatched,
  'unwatch': unwatchMovie,
}

const viewCommands = {
  'list': showList,
  'watchedlist': showWatched,
}

const helpText = {
  '!movie help': 'Show this help text',
  '!movie add <name>': 'Adds a movie to the list',
  '!movie list': 'Shows the movie list and votes',
  '!movie remove <movie name>': 'Removes a movie from the list (admin only)',
  '!movie vote': 'Vote for a movie',
  '!movie unvote': 'Remove your vote from the list (if you have one)',
  '!movie addadmin <id>': 'Adds an admin to the admin list (admin only, use Discord ID not username)',
  '!movie deladmin <id>': 'Removes an admin to the admin list (admin only, use Discord ID not username)',
  '!movie watch <name>': 'Move a movie from the voting list to the watched list (admin only)',
  '!movie watchedlist': 'Show list of watched movies',
  '!movie unwatch <name>': 'Moves a movie from the watched list back to the vote list (votes reset to 0) (admin only)',
}

require('dotenv').config();

const reactionArray = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];
const leftArrow = '⬅️';
const rightArrow = '➡️';
const CHANNEL_IDS = ['827571407872589884', '835631070598529054'];
const VIEW_CHANNEL_IDS = ['826628950914498573', '818984959754240040'];
let msgDeleted;

const DELETE_TIMEOUT = 10000;

let movieList = [];
let adminList = [];
let watchedMovieList = [];

const embedBase = new Discord.MessageEmbed()
  .setColor('#f5bc42')
  .setTitle('Current list:')
  .setAuthor('Beehive Movie List')

  const watchedEmbedBase = new Discord.MessageEmbed()
    .setColor('#f5bc42')
    .setTitle('Watched Movies:')
    .setAuthor('Beehive Movie List')

const helpEmbedBase = new Discord.MessageEmbed()
  .setColor('#f5bc42')
  .setAuthor('Beehive Movie List')
  .setTitle('Movie List Commands:')

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
  });
  
  fs.readFile(adminFileName, 'utf8', (err, data) => {
    if (err) {
      fs.writeFile(adminFileName, JSON.stringify([]), () => { });
    }
    else {
      try {
        adminList = JSON.parse(data);
      }
      catch (err) {
        adminList = [];
      }
    }
  });
  
  fs.readFile(watchedListFileName, 'utf8', (err, data) => {
    if (err) {
      fs.writeFile(watchedListFileName, JSON.stringify([]), () => { });
    }
    else {
      try {
        watchedMovieList = JSON.parse(data);
      }
      catch (err) {
        watchedMovieList = [];
      }
    }
  });

  console.log(commands);
})

const commandPrefix = '!movie ';

client.on('message', msg => {
  if (msg.content === 'Hello' && Math.floor(Math.random() * 10) < 1) {
    msg.channel.send('Sup, ladies. My name\'s Slim Shady, and I\'m the lead singer of D12 baby');
  }
  if (msg.author.id == '265540781643792386' && Math.floor(Math.random() * 100) < 1) {
    msg.channel.send('Dad?');
  }
  if (msg.author.bot) { return }
  if (!msg.content.startsWith(commandPrefix)) { return }
  if (!CHANNEL_IDS.includes(msg.channel.id)) {
    if (VIEW_CHANNEL_IDS.includes(msg.channel.id)) {
      let commandBody = msg.content.substring(commandPrefix.length)
      command = commandBody.split(' ')[0];
      commandInput = commandBody.substring(command.length + 1);

      if (Object.keys(viewCommands).includes(command.toLowerCase())) {
        viewCommands[command.toLowerCase()](msg, commandInput);
      }
      else {
        msg.channel.send(`Invalid Command: ${command}.  You might be in the wrong channel`);
      }
      return
    }
    else {
      return
    }
  }

  let commandBody = msg.content.substring(commandPrefix.length)
  command = commandBody.split(' ')[0];
  commandInput = commandBody.substring(command.length + 1);

  if (Object.keys(commands).includes(command.toLowerCase())) {
    commands[command.toLowerCase()](msg, commandInput);
  }
  else {
    msg.channel.send(`Invalid Command: ${command}`);
  }

});

function help(msg) {
  
  let newEmbed = new Discord.MessageEmbed(helpEmbedBase);
  for (let func in helpText) {
    newEmbed.addFields({ name: func, value: helpText[func] });
  }
  newEmbed.setTimestamp();
  msg.channel.send(newEmbed);
}

function addMovie(msg, input) {
  msg.channel.send(`adding movie: ${input}`);
  for (let movie of movieList) {
    if (movie.name.toLowerCase() == input.toLowerCase()) {
      msg.channel.send(`Cannot add movie ${input}.  It's already on the list!`);
      return
    }
  }
  movieList.push({ name: input, votes: [] });
  saveList();

  showList(msg).then(msg.delete());
}

function unvote(msg) {
  let voteRemoved = false;
  for (let movie of movieList) {
    const voteIdx = movie.votes.indexOf(msg.author.id);
    if (voteIdx >= 0) {
      movie.votes.splice(voteIdx, 1);
      msg.guild.members.fetch(msg.author.id).then(name => msg.channel.send(`Removed your vote, ${name.nickname || msg.author.username}`));
      saveList();
      voteRemoved = true;
    }
  }
  if (!voteRemoved) {
    msg.channel.send();
    msg.guild.members.fetch(msg.author.id).then(name => msg.channel.send(`You don't have any votes, ${name.nickname || msg.author.username}`));
  }
}

async function addReactions(msg, reactionArr) {
  for (let reaction of reactionArr) {
    await msg.react(reaction);
  }
}

async function sendVoteMessage(msg, voteList, index, filter) {
  let collectorBlock = true;

  let msgDeleted = false;
  msg.channel.send(voteList[index].message)
    .then(async (thisMsg) => {
      addReactions(thisMsg, voteList[index].emotes).then(() => {
        collectorBlock = false;
        deleteMessagePromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            if (!msgDeleted) {
              msg.guild.members.fetch(msg.author.id).then(name => msg.channel.send(`Too slow, ${name.nickname || msg.author.username}`));
              thisMsg.delete()
            }
            resolve('deleting message');
          }, DELETE_TIMEOUT);
        });
      });
      const collector = thisMsg.createReactionCollector(filter, { max: 1000, time: 10000 });
      collector.on('collect', (reaction, user) => {
        if (!collectorBlock) {
          if (reaction.emoji.name === leftArrow) {
            thisMsg.delete().then(() => {msgDeleted = true});
            sendVoteMessage(msg, voteList, index - 1, filter);
          }
          else if (reaction.emoji.name === rightArrow) {
            thisMsg.delete().then(() => {msgDeleted = true});
            sendVoteMessage(msg, voteList, index + 1, filter);
          }
          else {
            const reactionIdx = reactionArray.indexOf(reaction.emoji.name);
            if (reactionIdx >= 0) {
              // check all movies to see if user has already voted
              for (let movie of movieList) {
                const voteIdx = movie.votes.indexOf(user.id);
                if (voteIdx >= 0) {
                  movie.votes.splice(voteIdx, 1);
                }
              }
              // add if not already voted
              if (!movieList[reactionIdx].votes.includes(user.id)) {
                movieList[reactionIdx].votes.push(user.id);
                msg.guild.members.fetch(msg.author.id).then(name => msg.channel.send(`${name.nickname || msg.author.username} voted for movie: ${movieList[reactionIdx].name}`));
              }
            }
            saveList();
            thisMsg.delete().then(() => {msgDeleted = true});
          }
        }
      });
    });
}

function findMovieIndex(movieArr, movieName) {
  for (let [idx, movie] of movieArr.entries()) {
    if (movie.name.toLowerCase() === movieName.toLowerCase()) {
      return idx
    }
  }
  return -1;
}

function unwatchMovie(msg, movieName) {
  if (adminList.includes(msg.author.id)) {
    if (watchedMovieList.some((movie) => movie.name.toLowerCase() === movieName.toLowerCase())) {
      const movieIdx = findMovieIndex(watchedMovieList, movieName);
      if (movieIdx >= 0) {
        let thisMovie = watchedMovieList[movieIdx];
        thisMovie.votes = [];
        movieList.push(thisMovie);
        watchedMovieList.splice(movieIdx, 1);
        saveList();
        saveWatchedList();
        msg.channel.send(`Movie: "${movieName}" added back to voting list`);
      }
    }
    else {
      msg.channel.send(`Movie: "${movieName}" not found`);
    }
  }
  else {
    msg.channel.send('Only admins can move a movie to the watched list!');
  }
}

function watchMovie(msg, movieName) {
  if (adminList.includes(msg.author.id)) {
    if (movieList.some((movie) => movie.name.toLowerCase() === movieName.toLowerCase())) {
      const movieIdx = findMovieIndex(movieList, movieName);
      if (movieIdx >= 0) {
        watchedMovieList.push(movieList[movieIdx]);
        movieList.splice(movieIdx, 1);
        saveList();
        saveWatchedList();
        msg.channel.send(`Movie: "${movieName}" added to watched list`);
      }
    }
    else {
      msg.channel.send(`Movie: "${movieName}" not found`);
    }
  }
  else {
    msg.channel.send('Only admins can move a movie to the watched list!');
  }
}

function addAdmin(msg, adminId) {
  if (adminList.includes(msg.author.id)) {
    adminList.push(adminId)
    saveAdminList().then(msg.delete());
  }
  else {
    msg.channel.send('Nice try, only admins can add admins!').then(msg.delete());
  }
}

function delAdmin(msg, adminId) {
  if (adminList.includes(msg.author.id)) {
    adminList.splice(adminList.indexOf(adminId), 1);
    saveAdminList().then(msg.delete());
  }
  else {
    msg.channel.send('Nice try, only admins can add admins!').then(msg.delete());
  }
}

function voteMovie(msg) {
  const voteList = buildVoteList();
    
  const filter = (reaction, user) => {
    return (reactionArray.includes(reaction.emoji.name) || reaction.emoji.name === leftArrow || reaction.emoji.name === rightArrow) && msg.author.id === user.id;
  }
  let pageIdx = 0;

  sendVoteMessage(msg, voteList, pageIdx, filter)
  .then(() => {
    msg.delete();
  });
}

function buildVoteList() {
  let voteListArr = [];
  const voteListBase = new Discord.MessageEmbed()
    .setColor('#f5bc42')
    .setTitle('Vote for a movie:')
  // .setAuthor('Beehive Movie List')
  // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
  const itemsPerPage = 5;
  const numPages = Math.floor(movieList.length / itemsPerPage);

  for (page = 0; page <= numPages; ++page) {
    let emoteArr = [];
    if (page != 0) { emoteArr.push(leftArrow); }
    let newPage = new Discord.MessageEmbed(voteListBase);
    for (let idxOffset = 0; idxOffset < itemsPerPage; ++idxOffset) {
      const movieIdx = page * itemsPerPage + idxOffset;
      if (movieIdx >= movieList.length) { break }
      const movie = movieList[movieIdx];
      newPage.addFields({ name: `${reactionArray[movieIdx]}`, value: `${movie.name}` });
      emoteArr.push(reactionArray[movieIdx]);
    }
    if (page < numPages) { emoteArr.push(rightArrow); }
    voteListArr.push({ message: newPage, emotes: emoteArr });
  }

  return voteListArr;
}

function removeMovie(msg, input) {
  if (adminList.includes(msg.author.id)) {
    for (let [idx, movie] of movieList.entries()) {
      if (movie.name.toLowerCase() == input.toLowerCase()) {
        movieList.splice(idx, 1);
        break
      }
    }
    saveList();
    showList(msg).then(msg.delete());
  }
}

function saveList() {
  fs.writeFile(listFileName, JSON.stringify(movieList), () => { });
}

function saveWatchedList() {
  fs.writeFile(watchedListFileName, JSON.stringify(watchedMovieList), () => { });
}

async function saveAdminList() {
  fs.writeFile(adminFileName, JSON.stringify(adminList), () => { });
}

async function showList(msg) {
  let newEmbed = new Discord.MessageEmbed(embedBase);

  movieList.forEach(movie => newEmbed.addFields({ name: movie.name, value: movie.votes.length }));
  newEmbed.setTimestamp();

  msg.channel.send(newEmbed);
}

async function showWatched(msg) {
  let newEmbed = new Discord.MessageEmbed(watchedEmbedBase);

  watchedMovieList.forEach(movie => newEmbed.addFields({ name: movie.name, value: movie.votes.length }));
  newEmbed.setTimestamp();

  msg.channel.send(newEmbed);
}