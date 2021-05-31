const fetch = require('node-fetch');

module.exports = {
    name: 'panda',
    description: 'Gets a random panda from the internet.',
    async execute(bot, msg, args, functions) {
        const panda_api = await fetch('https://some-random-api.ml/animal/panda').then(res => res.json());
        const panda = functions.embed(msg.author, { title: '🐼' })
        .setDescription(panda_api.fact)
        .setImage(panda_api.image)
        .setColor('#eeeeee');
        msg.channel.send(panda);
    },
};