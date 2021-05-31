exports.run = async (bot, db, functions, Config, member) => {
  const guild = member.guild;
  db.query(`SELECT * FROM guild_settings WHERE guild_id = '${guild.id}'`, (err, guilds) => {
    if(err) return functions.log_error(err);
    if(!guilds.length) return;
    const wl_channel = guild.channels.cache.get(guilds[0].wl_channel);
    const message_fields = {
      mention: member,
      tag: member.user.tag,
      username: member.user.username,
      server: guild.name,
    };
    let leave_message = guilds[0].leave_message;
    if(!leave_message || !wl_channel || !wl_channel.viewable) return;
    Object.keys(message_fields).forEach(field => {
      const regex = new RegExp(`\\{${field}\\}`, 'g');
      leave_message = leave_message.replace(regex, message_fields[field]);
    });
    const leave_embed = functions.embed(member.user, { title: '' })
    .setAuthor(guild.name, guild.iconURL({ dynamic: true }))
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(functions.truncate(leave_message, 2048));
    wl_channel.send(leave_embed).catch(() => true);
  });

  db.query(`DELETE FROM verification WHERE guild_id = '${guild.id}' AND member_id = '${member.id}'`, err => {
    if(err) functions.log_error(err);
  });
};