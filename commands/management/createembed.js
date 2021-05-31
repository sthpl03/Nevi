const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'createembed',
    description: 'Converts the specified embed object into an embed.',
    usage: '(embed object)',
    examples: [
        '{ "title": "Hello!", "description": "This is an example." }',
    ],
    member_permissions: ['MANAGE_MESSAGES'],
    arguments: true,
    execute(bot, msg, args, functions) {
        try {
            const embed = JSON.parse(args.join(' ').replace(/(?<!\\)'/g, '"').replace(/\\(?=')/g, ''));
            const embed_created = new MessageEmbed(embed);
            msg.channel.send(embed_created).catch(e => {
                functions.send_embed(msg, `There was an error while parsing to an embed | Error: \`${e.message}\``);
            });
            msg.delete();
        }
        catch(e) {
            functions.send_embed(msg, `There was an error while parsing to an embed, Read [this](https://discordjs.guide/popular-topics/embeds.html#using-an-embed-object) to see how to use an embed object | Error: \`${e.message}\``);
        }
    },
};