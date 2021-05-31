const ms = require('ms');

exports.run = async (bot, db, functions, Config, member) => {
  const guild = member.guild;
  db.query(`SELECT * FROM guild_settings WHERE guild_id = '${guild.id}'`, async (err, guilds) => {
    if(err) return functions.log_error(err);
    const guild_settings = guilds[0] || {
      welcome_message: '',
      wm_type: 0,
      wl_channel: '',
      verification: 0,
      verification_channel: '',
      verified_role: '',
      join_lock: 0,
      lock_reason: 'Join Lock',
      default_role: '',
      prefix: Config.prefix,
    };

    if(guild_settings.welcome_message) {
      const message_fields = {
        mention: member,
        tag: member.user.tag,
        username: member.user.username,
        server: guild.name,
      };
      let welcome_message = guild_settings.welcome_message;
      Object.keys(message_fields).forEach(field => {
        const regex = new RegExp(`\\{${field}\\}`, 'g');
        welcome_message = welcome_message.replace(regex, message_fields[field]);
      });
      const wl_channel = guild.channels.cache.get(guild_settings.wl_channel);
      const welcome_embed = functions.embed(member.user, { title: '' })
      .setAuthor(guild.name, guild.iconURL({ dynamic: true }))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(functions.truncate(welcome_message, 2048));
      if(!wl_channel || !wl_channel.viewable) return;
      if(guild_settings.wm_type) {
        member.send(welcome_embed).catch(() => {
          wl_channel.send(member, welcome_embed);
        });
      }
      else wl_channel.send(member, welcome_embed);
    }

    if(guild_settings.join_lock && member.kickable) {
      await functions.send_embed(member, `The server you are trying to join is currently closed, try again later | ${guild_settings.lock_reason}`);
      member.kick(guild_settings.lock_reason);
      return;
    }

    const default_role = guild.roles.cache.get(guild_settings.default_role);
    if(default_role && default_role.editable && !default_role.permissions.has('ADMINISTRATOR')) member.roles.add(default_role, 'Default Role');

    db.query(`SELECT reason FROM kicks WHERE guild_id = '${guild.id}' AND member_id = '${member.id}'`, (err, kicks) => {
      if(err) return functions.log_error(err);
      if(kicks.length && member.kickable) member.kick(kicks[0].reason);
    });

    db.query(`SELECT * FROM roles WHERE guild_id = '${guild.id}' AND member_id = '${member.id}'`, (err, roles) => {
      if(err) return functions.log_error(err);
      if(!roles.length) return;
      roles.forEach(r => {
        const role = guild.roles.cache.get(r.role_id);
        const time_left = (r.created_at + r.duration) - Date.now();
        if(!role || !role.editable || role.permissions.has('ADMINISTRATOR')) return;
        function handle_timeout() {
          member.roles.remove(role, 'Time ran out').then(() => {
            db.query(`DELETE FROM roles WHERE id = ${r.id}`);
          });
        }
        member.roles.add(role, r.reason).then(() => {
          if(r.duration) setTimeout(handle_timeout, time_left);
        });
      });
    });

    if(guild_settings.verification) {
      const verification_channel = guild.channels.cache.get(guild_settings.verification_channel);
      const verified_role = guild.roles.cache.get(guild_settings.verified_role);
      if(!verified_role || !verified_role.editable || verified_role.permissions.has('ADMINISTRATOR') || !verification_channel) return;
      if(Date.now() - member.user.createdTimestamp < ms('1w')) return functions.send_embed(member, 'Your account is too new, please DM someone that can verify you to get verified. This is to prevent alts.');
      let token = [];
      for(let index = 0; index < 4; index++) {
          token.push(Math.random().toString(36).substring(2, 10));
      }
      token = token.join('-');
      db.query(`INSERT INTO verification(guild_id, member_id, token) VALUES('${guild.id}', '${member.id}', '${token}')`, (err, res) => {
          if(err) return functions.log_error(err);
          function handle_timeout() {
            if(member.roles.cache.has(verified_role.id)) return;
            db.query(`DELETE FROM verification WHERE id = ${res.insertId}`, async err => {
              if(err) return functions.log_error(err);
              await functions.send_embed(member, 'You didn\'t verify in time, please rejoin the server to try again.');
              member.kick('Didn\'t verify in time');
            });
          }
          functions.send_embed(member, `Verify yourself by entering this link: https://nevi.tk/verification?token=${token}`).then(() => {
            setTimeout(handle_timeout, ms('1h'));
          }, e => {
            functions.send_embed(verification_channel, `There was a problem while DMing you the verification, do \`${guild_settings.prefix}verify\` to try again | Error: \`${e.message}\``, { header: member });
            db.query(`DELETE FROM verification WHERE id = ${res.insertId}`);
          });
      });
    }
  });
};