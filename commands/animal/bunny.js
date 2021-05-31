const fetch = require('node-fetch');

module.exports = {
    name: 'bunny',
    aliases: ['rabbit'],
    description: 'Gets a random bunny from the internet.',
    async execute(bot, msg, args, functions) {
        const bunny_api = await fetch('https://api.bunnies.io/v2/loop/random/?media=gif,png').then(res => res.json());
        const bunny = functions.embed(msg.author, { title: '🐰' })
        .setImage(bunny_api.media.gif)
        .setColor('#99AAB5');
        msg.channel.send(bunny);
    },
};