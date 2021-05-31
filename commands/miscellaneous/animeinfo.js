const fetch = require('node-fetch');

module.exports = {
    name: 'animeinfo',
    aliases: ['anime'],
    description: 'Gets the information of the specified anime.',
    usage: '(anime) [(page)]',
    examples: [
        'Naturo',
        'Naturo [2]',
    ],
    arguments: true,
    cooldown: '10s',
    async execute(bot, msg, args, functions) {
        const anime = args.join(' ').split('[')[0];
        const page = Number(args.join(' ').match(/(?<=\[)\d*(?=\])/g)) || 1;
        if(!anime) return functions.send_embed(msg, 'You didn\'t specify an anime.');
        if(anime.length < 3) return functions.send_embed(msg, 'The anime name has to be at least `3` characters long.');
        const anime_api = await fetch(`https://api.jikan.moe/v3/search/anime?q=${encodeURI(anime)}`).then(res => res.json());
        if(!anime_api.results.length) return functions.send_embed(msg, 'You didn\'t specify a valid anime.');
        if(page > anime_api.results.length) return functions.send_embed(msg, 'You didn\'t specify a valid page.');
        const current_anime = anime_api.results[page - 1];
        const anime_info = functions.embed(msg.author, { title: current_anime.title })
        .setURL(current_anime.url)
        .setDescription(current_anime.synopsis)
        .setThumbnail(current_anime.image_url)
        .addField('Type', current_anime.type, true)
        .addField('Episodes', current_anime.episodes, true)
        .addField('Score', current_anime.score, true)
        .addField('Members', current_anime.members.toLocaleString())
        .addField('Start Date', current_anime.start_date.split('T')[0], true)
        .addField('End Date', current_anime.end_date.split('T')[0], true)
        .addField('Airing', current_anime.airing ? 'Yes' : 'No', true)
        .setFooter(`${functions.fix_user(msg.author)} | Page: ${page}/${anime_api.results.length}`, msg.author.displayAvatarURL({ dynamic: true }));
        msg.channel.send(anime_info);
    },
};