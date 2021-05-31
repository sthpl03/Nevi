exports.run = async (bot, db, functions, Config, msg) => {
  if(msg.author.bot) return;
  db.query(`SELECT messages_logs_channel FROM guild_settings WHERE guild_id = '${msg.guild.id}'`, (err, guilds) => {
    if(err) return functions.log_error(err, null);
    if(!guilds.length) return;
    const messages_logs_channel = msg.guild.channels.cache.get(guilds[0].messages_logs_channel);
    if(!messages_logs_channel || !messages_logs_channel.viewable) return;
    const deleted_message = functions.embed(msg.author, { title: 'Messages Logs' })
    .setDescription(`A message has been deleted in ${msg.channel}`)
    .addField('Author', msg.author, true)
    .addField('Channel', msg.channel, true)
    .addField('Content', msg.content, true)
    .addField('Pinned', msg.pinned ? 'Yes' : 'No', true)
    .setColor('#DD2E44');
    messages_logs_channel.send(deleted_message).catch(() => true);
  });
};