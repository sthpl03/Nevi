const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'category',
    description: 'Enables or disables the specified category.',
    fields: [
        {
            name: 'Types',
            value: [
                '`enable` - Enables the category.',
                '`disable` - Disables the category.',
            ].join('\n'),
        },
    ],
    usage: '(type) (category)',
    examples: [
        'disable animal',
        'animal',
    ],
    arguments: true,
    member_permissions: ['MANAGE_GUILD'],
    cooldown: '10s',
    execute(bot, msg, args, functions, db) {
        const types = ['enable', 'disable'];
        let type = types.find(t => t == args[0].toLowerCase());
        if(type) args.splice(0, 1);
        const category = fs.readdirSync('./commands/').find(dir => dir == (args[0] || '').toLowerCase());
        if(!category) return functions.send_embed(msg, 'You didn\'t specify a valid category.');
        db.query(`SELECT * FROM categories WHERE guild_id = '${msg.guild.id}' AND category = '${category}'`, (err, categories) => {
            if(err) return functions.log_error(err);
            let sql;
            if(!categories.length) {
                if(type == 'enable') return functions.send_embed(msg, 'That category has already been enabled.');
                type = 'Disable';
                sql = `INSERT INTO categories(guild_id, category) VALUES('${msg.guild.id}', '${category}')`;
            }
            else {
                if(type == 'disable') return functions.send_embed(msg, 'That category has already been disabled.');
                type = 'Enable';
                sql = `DELETE FROM categories WHERE id = ${categories[0].id}`;
            }
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                functions.send_embed(msg, `The \`${category}\` category has been ${type.toLowerCase()}d.`);
                const command_log = new MessageEmbed()
                .setDescription(`A category has been ${type.toLowerCase()}d by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Type', type, true)
                .addField('Category', category, true);
                functions.log_command(this.name, command_log, msg);
            });
        });
    },
};