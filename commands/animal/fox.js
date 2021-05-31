const fetch = require('node-fetch');

module.exports = {
    name: 'fox',
    description: 'Gets a random fox from the internet.',
    async execute(bot, msg, args, functions) {
        const fox_api = await fetch('https://randomfox.ca/floof/').then(res => res.json());
        const fox = functions.embed(msg.author, { title: '🦊' })
        .setImage(fox_api.image)
        .setColor('#F4900C');
        msg.channel.send(fox);
    },
};