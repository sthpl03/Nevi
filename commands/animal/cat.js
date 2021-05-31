const fetch = require('node-fetch');

module.exports = {
    name: 'cat',
    aliases: ['kitty'],
    description: 'Gets a random cat from the internet.',
    async execute(bot, msg, args, functions) {
        const cat_api = await fetch('https://api.thecatapi.com/v1/images/search').then(res => res.json());
        const cat = functions.embed(msg.author, { title: '🐱' })
        .setImage(cat_api[0].url)
        .setColor('#ffcd4c');
        msg.channel.send(cat);
    },
};