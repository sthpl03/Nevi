const fetch = require('node-fetch');

module.exports = {
    name: 'duck',
    aliases: ['duk'],
    description: 'Gets a random duck from the internet.',
    async execute(bot, msg, args, functions) {
        const duck_api = await fetch('https://random-d.uk/api/v2/random').then(res => res.json());
        const duck = functions.embed(msg.author, { title: '🦆' })
        .setImage(duck_api.url)
        .setColor('#3E721D');
        msg.channel.send(duck);
    },
};