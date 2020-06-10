const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json');

const RequestChannelId = config.requestChannelId; //보이스 채널 신청 채널
const ParentChannelId  = config.parentChannelId;  //보이스 채널 생성 위치
const LogChannelId     = config.logChannelId;     //유저 JOIN, LEAVE 기록할 채널
const GameRunningRole  = config.gameRunningRole;  //게임 실행시 부여될 등급
const GameTitleName    = config.gameTitleName;    //게임 이름

const UserChannels = [];
const GameUserList = [];

client.on('ready', () => {
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
    let userChannelIndex = UserChannels.findIndex(id => id === oldMember.channelID);

    if (newMember.channelID === RequestChannelId) {
        newMember.guild.channels.create(newMember.member.user.tag, {
            type: "voice",
            bitrate: config.bitrate,
            parent: newMember.guild.channels.cache.find(channel => channel.id === ParentChannelId)
        }).then(r => {
            r.createOverwrite(newMember.member, {
                'MANAGE_CHANNELS': true
            }).catch(console.error);

            newMember.member.voice.setChannel(r.id);
            UserChannels.push(r.id);
        });
    }

    if (userChannelIndex !== -1) {
        if (oldMember.channel.members.size <= 0) {
            oldMember.channel.delete("user empty").then(channel => {
                UserChannels.slice(userChannelIndex, 1);
            });
        }
    }
});

client.on("presenceUpdate", (oldUser, newUser) => {
    let gamingUser = GameUserList.findIndex(id => id === newUser.user.id);

    if (gamingUser === -1) {
        if (newUser.activities.findIndex(activity => activity.name.toLowerCase() === GameTitleName.toLowerCase()) !== -1) {
            newUser.member.roles.add(newUser.guild.roles.cache.get(GameRunningRole)).then(role => {
                GameUserList.push(newUser.user.id);
            });
        }
    } else {
        if (oldUser.activities.findIndex(activity => activity.name.toLowerCase() === GameTitleName.toLowerCase()) !== -1) {
            oldUser.member.roles.remove(oldUser.guild.roles.cache.get(GameRunningRole)).then(role => {
                GameUserList.slice(GameUserList.findIndex(id => id === newUser.user.id), 1);
            });
        }
    }
});

client.on('guildMemberAdd', member => {
    console.log("입장");
    client.channels.cache.get(LogChannelId).send(`${member.user.tag} 님이 입장`);
});

client.on("guildMemberRemove", member => {
    console.log("퇴장");
    client.channels.cache.get(LogChannelId).send(`${member.user.tag} 님이 퇴장`);
});


client.login(config.token);