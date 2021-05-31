const { ShardingManager } = require('discord.js');
const { token } = require('./config.json');
const shard_manager = new ShardingManager('./bot.js', { token: token });

shard_manager.spawn();

shard_manager.on('shardCreate', shard => {
    console.log(`New shard launched: ${shard.id}`);
});