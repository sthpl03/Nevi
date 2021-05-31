const fetch = require('node-fetch');

module.exports = {
    name: 'urban',
    aliases: ['define'],
    description: 'Gets the definition and usage of the specified word.',
    usage: '(word) [(page)]',
    examples: [
        'Example',
        'Example [2]',
    ],
    arguments: true,
    cooldown: '5s',
    async execute(bot, msg, args, functions) {
        const word = args.join(' ').split('[')[0];
        const page = Number(args.join(' ').match(/(?<=\[)\d*(?=\])/g)) || 1;
        if(!word) return functions.send_embed(msg, 'You didn\'t specify a word.');
        const urban_api = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURI(word)}`).then(res => res.json());
        if(urban_api.error) return functions.send_embed(msg, `There was a problem while fetching the urban dictionary api | Error: \`${urban_api.error}\``);
        if(!urban_api.list.length) return functions.send_embed(msg, 'That word doesn\'t have a definition.');
        if(page > urban_api.list.length) return functions.send_embed(msg, 'You didn\'t specify a valid page.');
        function link_definitions(string, max_length) {
            if(!string) return;
            string = functions.truncate(string, max_length);
            const definitions = string.match(/(?<=\[).*?(?=\])/g);
            if(definitions) {
                definitions.forEach(definition => {
                    const regex = new RegExp(`\\[${definition}\\]`, 'g');
                    string = string.replace(regex, `[${definition}](https://www.urbandictionary.com/define.php?term=${encodeURI(definition)})`);
                });
            }
            return string;
        }
        const word_found = urban_api.list[page - 1];
        const rate = (Math.round(word_found.thumbs_up / (word_found.thumbs_up + word_found.thumbs_down) * 100) || 50) + '%';
        const word_embed = functions.embed(null, { title: word_found.word })
        .setURL(word_found.permalink)
        .setDescription(link_definitions(word_found.definition, 2048))
        .addField('Example', link_definitions(word_found.example, 1024) || 'This word doesn\'t have an example.')
        .addField(`Rating (${rate})`, `**- Upvotes:** ${word_found.thumbs_up} \n **- Downvotes:** ${word_found.thumbs_down}`)
        .setFooter(`${functions.fix_user(msg.author)} | Page: ${page}/${urban_api.list.length}`, msg.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp(new Date(word_found.written_on));
        msg.channel.send(word_embed);
    },
};