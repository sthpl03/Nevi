const { MessageEmbed } = require('discord.js');
const { max_reason_length } = require('../../config.json');

module.exports = {
    name: 'rolepersist',
    description: 'Gives or removes the role given from the specified member even if the member rejoins the guild.',
    fields: [
        {
            name: 'Types',
            value: [
                '`add` - Adds the rolepersist to the member.',
                '`remove` - Removes the rolepersist from the member.',
            ].join('\n'),
        },
    ],
    usage: '(type) (member) (role), (reason)',
    examples: [
        '@Nevysian#2014 VC Ban',
        '@Nevysian#2014 VC Ban, Earraping.',
        'add @Nevysian#2014 VC Ban',
        'add @Nevysian#2014 VC Ban, Earraping.',
    ],
    arguments: true,
    permissions: ['MANAGE_ROLES'],
    cooldown: '10s',
    async execute(bot, msg, args, functions, db) {
        const types = ['add', 'remove'];
        let type = types.find(t => t == args[0].toLowerCase());
        if(type) args.splice(0, 1);
        const member = msg.guild.members.cache.get(args[0]) || msg.mentions.members.first();
        const role = msg.guild.roles.cache.get((args[1] || '').split(',')[0]) || msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.slice(1).join(' ').split(', ')[0].toLowerCase()));
        const reason = args.slice(1).join(' ').split(', ').slice(1).join(', ') || 'No reason given.';
        if(!member) return functions.send_embed(msg, 'You didn\'t specify a valid member.');
        if(!role || role.id == msg.guild.roles.everyone.id) return functions.send_embed(msg, 'You didn\'t specify a valid role.');
        if(role.position >= msg.member.roles.highest.position) return functions.send_embed(msg, 'You don\'t have permissions to make changes to that role.');
        if(!role.editable) return functions.send_embed(msg, 'I don\'t have permissions to make changes to that role.');
        if(role.permissions.has('ADMINISTRATOR')) return functions.send_embed(msg, 'Roles with the `ADMINISTRATOR` permission can\'t be rolepersisted.');
        if(reason.length > max_reason_length) return functions.send_embed(msg, `The reason can't be longer than \`${max_reason_length}\` characters.`);
        db.query(`SELECT * FROM roles WHERE guild_id = '${msg.guild.id}' AND member_id = '${member.id}' AND role_id = '${role.id}'`, async (err, roles) => {
            if(err) return functions.log_error(err);
            let sql;
            if(roles.length) {
                if(type == 'add') return functions.send_embed(msg, 'That member has already been rolepersisted with that role.');
                type = 'Remove';
                await member.roles.remove(role, reason).then(() => {
                    sql = `DELETE FROM roles WHERE id = ${roles[0].id}`;
                }, e => {
                    functions.send_embed(msg, `There was a problem while removing the ${role} role from that member | Error: \`${e.message}\``);
                });
            }
            else {
                if(type == 'remove') return functions.send_embed(msg, 'The rolepersist has already been removed from that member.');
                type = 'Add';
                await member.roles.add(role, reason).then(() => {
                    sql = `INSERT INTO roles (guild_id, member_id, role_id, reason, created_at) VALUES('${msg.guild.id}', '${member.id}', '${role.id}', ${db.escape(reason)}, ${Date.now()})`;
                }, e =>{
                    functions.send_embed(msg, `There was a problem while giving that member the ${role} role | Error: \`${e.message}\``);
                });
            }
            if(!sql) return;
            db.query(sql, err => {
                if(err) return functions.log_error(err);
                if(type == 'Add') functions.send_embed(msg, `${member} has been rolepersisted with the ${role} role | ${reason}`);
                else functions.send_embed(msg, `${member} has been removed from the ${role} rolepersist | ${reason}`);
                const command_log = new MessageEmbed()
                .setDescription(`A member has been ${type == 'Add' ? 'rolepersisted' : 'unrolepersisted'} by ${msg.author}`)
                .addField('Author', msg.author, true)
                .addField('Victim', member, true)
                .addField('Role', role, true)
                .addField('Reason', reason, true)
                .addField('Type', type, true);
                functions.log_command(this.name, command_log, msg, { guild_id: msg.guild.id, member_id: member.id, log_by: msg.author.id, type: type == 'Add' ? 'Rolepersist' : 'Unrolepersist', reason: reason });
            });
        });
    },
};