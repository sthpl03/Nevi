const fetch = require('node-fetch');

module.exports = {
    name: 'mclookup',
    aliases: ['minecraft'],
    description: 'Gets the information of the minecraft player found by the username or uid given.',
    usage: '(username | uid)',
    examples: [
        'Nevysian',
        'bb3d3970-8a27-4d09-8b74-1986abc49072',
    ],
    arguments: true,
    async execute(bot, msg, args, functions) {
        const user = args.join(' ');
        const minecraft_emoji = '<:minecraftIcon:724025389113933825>';
        const minecraft_api = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURI(user)}`).then(res => res.json());
        if(minecraft_api.error) return functions.send_embed(msg, 'You didn\'t specify a valid user or there was an error with the API.');
        const player = minecraft_api.data.player;
        const minecraft_embed = functions.embed(msg.author, { title: `${minecraft_emoji} ${player.username}` })
        .setThumbnail(`https://crafatar.com/renders/body/${player.id}?MHF_Steve&overlay`)
        .addField('Name History', player.meta.name_history.map(n => n.changedToAt ? `${n.name} \`${functions.to_date(n.changedToAt)}\`` : n.name))
        .addField('UID', player.id, true)
        .addField('Raw UID', player.raw_id, true)
        .setColor('#69c65b');
        msg.channel.send(minecraft_embed);
    },
};