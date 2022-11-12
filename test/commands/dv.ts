import { MessageElem, segment } from "oicq"
import { Command } from '../../src/index'

const events = [
    ['抽卡', '抽卡全保底 副本零掉落', '金色传说！'],
    ['写作文', '可能会离题', '非常有文采'],
    ['搞基', '会被掰弯', '友谊地久天长'],
    ['扶老奶奶过马路', '会被讹', 'RP++'],
    ['开电脑', '意外的死机故障不可避免', '电脑的状态也很好'],
    ['重构代码', '越改越乱', '代码质量明显提高'],
    ['写作业', '上课讲了这些了吗', '都会写，写的全对'],
    ['睡觉', '翻来覆去睡不着', '养足精力，明日再战'],
    ['祭祀', '祖宗不知干啥就不鸟你', '得祖宗的庇护'],
    ['膜拜大神', '被大神鄙视', '接受神犇光环照耀'],
    ['洗澡', '一会只有热水，一会只有凉水', '你多久没洗澡了？'],
    ['熬夜', '熬夜导致身体不适', '事情终究是可以完成的'],
    ['泡妹子', '一定会被拒绝', '说不定可以牵手'],
    ['考试', '作弊会被抓', '学的全会，蒙的全对'],
    ['背诵课文', '记忆力只有50Byte', '看一遍就背下来了'],
    ['体育锻炼', '消耗的能量全吃回来了', '身体棒棒哒'],
    ['吃饭', '小心变胖啊', '人是铁饭是钢'],
    ['上课', '反正你听不懂', '100%消化'],
    ['装弱', '被看穿', '谦虚最好了'],
    ['纳财', '然而今天并没有财运', '要到好多Money'],
    ['发朋友圈', '会被当做卖面膜的', '分享是种美德'],
    ['装逼', '被识破', '获得众人敬仰'],
    ['打游戏', '被打成一团', '你是最强的'],
    ['出行', '路途必然坎坷', '一路顺风'],
    ['看电影', '被剧透', '电影很好看'],

]
const eventsWithGroup = {
    729471015: [
        ['搭讪xgg', 'xgg说你真下头', '获得xgg熊抱'],
    ],
    833938858: [
        ['喝奶茶', '小心变胖啊', '马总帮你报销了']
    ]
}

const luckText = {
    [-2]: '大凶',
    [-1]: '凶',
    [0]: '中平',
    [1]: '吉',
    [2]: '大吉',
}

function sample(size, arr) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

export default new Command({
    name: 'dv',
    description: '今日运势',
    args: [
    ],
    job: async (e, s, c) => {
        const today = new Date().toLocaleDateString()
        const data = s.data.public
        if (!data[e.sender.user_id] || data[e.sender.user_id].date !== today) {
            data[e.sender.user_id] = {
                date: today,
                info: ''
            }
        }
        if (!data[e.sender.user_id].info) {
            const luck = [-2, -1, -1, 0, 0, 1, 1, 2][Math.floor(Math.random() * 8)]
            const postive = luck >= -1 && 2 || 0, negative = luck <= 1 && 2 || 0
            const eventList = [...events]
            if (e.message_type === 'group' && eventsWithGroup[e.group_id]) {
                eventList.push(...eventsWithGroup[e.group_id])
            }
            // 从 eventList 中 随机选 (postive + negative) 个不重复的 events
            const allEvents = sample(postive + negative, eventList)
            for (let i = 0; i < postive; i++) allEvents[i] = ['宜: ' + allEvents[i][0], '🎉' + allEvents[i][2]]
            for (let i = postive; i < postive + negative; i++) allEvents[i] = ['忌: ' + allEvents[i][0], '💩' + allEvents[i][1]]
            data[e.sender.user_id].info = `今日运势：${luckText[luck]}\n${allEvents.map(e => e.join(' ')).join('\n')}`
        }
        await e.reply(data[e.sender.user_id].info)
    },
    groupWhitelist: {
        833938858: true,
        715207945: true,
        729471015: true,
    }
})