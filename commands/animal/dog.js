const fetch = require('node-fetch');

module.exports = {
    name: 'dog',
    aliases: ['doggo'],
    description: 'Gets a random dog from the internet.',
    async execute(bot, msg, args, functions) {
        const dog_api = await fetch('https://dog.ceo/api/breeds/image/random').then(res => res.json());
        if(dog_api.status != 'success') return functions.log_error(dog_api, msg, `There was a problem while the fetching random dog api | Error: \`${dog_api.message}\``);
        const dog = functions.embed(msg.author, { title: '🐶' })
        .setImage(dog_api.message)
        .setColor('#da9f83');
        msg.channel.send(dog);
    },
};