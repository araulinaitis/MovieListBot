const Discord = require('discord.js');
const http = require('http');

require('dotenv').config();

const client = new Discord.Client({
    partials: ['MESSAGE', 'REACTION', 'CHANNEL'],
});

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
    console.log('fuck yeah');
})

client.on('message', msg => {
    if(msg.content === 'Hello') {
        msg.reply('sup, ladies. My name\'s Slim Shady');
    }
});