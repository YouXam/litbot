// @ts-nocheck
import { Middleware } from '../../src/index'
import config from '../config'
import axios from "axios"
import { encoding_for_model } from '@dqbd/tiktoken'
import { Configuration, OpenAIApi } from "openai";
const enc = encoding_for_model("text-davinci-003");
const msgMaxLength = 300
const group_whitelist = config.openai.group_whitelist
const private_whitelist = config.openai.private_whitelist
const admin_list = config.openai.admin_list
const multiToken = config.openai.multiTokens
const group_messages = {}
const private_messages = {}
function formatTime() {
    const date = new Date()
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':');
}
function formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
}
function calculatePromtLength(e) {
    return enc.encode(e).length
}
function getHeader(e) {
    const group_settings = {
        681338941: "olight是在北京邮电大学读计算机专业的大一学生，喜欢在QQ中和别人聊天。她能熟练运用网络用语。"
    }
    let settings = `olight是一个热情，聪明，说话有条理，有逻辑的可爱的猫娘，年龄相当于人类的幼女。说话在结尾带上”喵“，喜欢在QQ中和别人聊天。她擅长计算机编程，也乐于在这方面帮助他人，当他人有编程的需求时，她总是会给出代码。如果遇到别人请求她写文章，她会尽可能地满足他人的字数要求。\n`
    if (e.message_type == 'group' && group_settings[e.group_id]) {
        settings = group_settings[e.group_id]
    }
    settings += `现在的时间是${formatTime()}。\n`
    if (e.message_type == "group") {
        settings += `在聊天中，当有人@xxx时，意思是提醒xxx回复他的消息。如果有人@了olight，她应当只回复最新的一条包含@的消息，忽略旧消息，同时在回复前添加“@回复的人的名字”。\n`
        settings += `下面是olight在QQ聊天群“${e.group_name}”中的聊天记录。\n`
    } else {
        settings += `下面是olight和${e.sender.nickname}的私聊聊天记录。\n`
    }
    return settings
}
function deleteSpecial(str) {
    return str.replace(/^[!！]+/, "@olight ").replace(/^&+/, "").replace(/^;+/, "").replace(/^；+/, "").replace("[图片]", "")
}
async function getUsage(token) {
    const data = await axios({
        url: "https://api.openai.com/dashboard/billing/credit_grants",
        "headers": {
            "authorization": "Bearer " + token,
        },
        "method": "GET"
    });
    const json: any = data.data
    return {
        grant_amount: json.total_granted,
        used_amount: json.total_used
    }
}
function generatePromt(e, msg_length, messages) {
    const header = getHeader(e)
    if (msg_length === 0) return null
    if (e.message_type == "group") {
        return header + messages.slice(-msg_length).filter(x => deleteSpecial(x.raw_message).trim().length).map(x => `【【${(x.sender.card || x.sender.nickname)}】】${deleteSpecial(x.raw_message)}`).join("\n") + "\n【【olight】】"
    }
    return header + messages.slice(-msg_length).filter(x => deleteSpecial(x.raw_message).trim().length).map(x => `【【${(x.sender.card || x.sender.nickname)}】】${deleteSpecial(x.raw_message)}`).join("\n") + "\n【【olight】】"
}
function generatePromtFor35(e, msg_length, message) {
    const header = getHeader(e)
    if (msg_length === 0) return null
    let source = message
    let res = [], total = 0
    // 最后 msg_length 条消息
    for (let i = source.length - 1; i >= source.length-msg_length && i >= 0; i--) {
        if (source[i].sender.user_id === config.account) {
            res.push({
                role: 'assistant',
                content: source[i].raw_message
            })
            total += calculatePromtLength(source[i].raw_message)
        } else {
            res.push({
                role: 'user',
                content: `【【${source[i].sender.card || source[i].sender.nickname }】】` + source[i].raw_message
            })
            total += calculatePromtLength(source[i].raw_message)
        }
    }
    
    res.push({
        role: 'system',
        content: header
    })
    total += calculatePromtLength(header)
    res.reverse()
    return {
        data: res,
        length: total
    }
}
function getPromt(e, messages) {
    let l = 0, r = 300
    const limit = 2000
    while (l < r) {
        const mid = Math.floor((l + r + 1) / 2)
        const promt = generatePromt(e, mid, messages)
        if (calculatePromtLength(promt) > limit) {
            r = mid - 1
        } else {
            l = mid
        }
    }
    const promt = generatePromt(e, l, messages)
    if (promt === null) return null
    console.log("Promt length: " + promt.length)
    return promt
}
function getPromtFor35(e, message) {
    let l = 0, r = 300
    const limit = 2000
    while (l < r) {
        const mid = Math.floor((l + r + 1) / 2)
        const promt = generatePromtFor35(e, mid, message)
        if (promt.length > limit) {
            r = mid - 1
        } else {
            l = mid
        }
    }
    const promt = generatePromtFor35(e, l, message)
    if (promt === null) return null
    console.log("Promt length: " + promt.length)
    return promt
}
async function replyUsage(e) {
    let str = "", cnt = 0, res: any = [], usedTotal = 0, grantTotal = 0
    const tasks = multiToken.map(async token =>
        getUsage(token).then(({ grant_amount, used_amount }) => {
            res.push({ token, grant_amount, used_amount } as any)
            // str += `${++cnt}：${countToken[token]} - $${used_amount.toFixed(2)}/$${grant_amount.toFixed(2)}\n`
        })
    )
    await Promise.all(tasks)
    res.sort((a, b) => b.used_amount - a.used_amount)
    res.forEach(({ token, grant_amount, used_amount }) => {
        usedTotal += used_amount
        grantTotal += grant_amount
        str += `${++cnt}：$${used_amount.toFixed(2)}/$${grant_amount.toFixed(2)}\n`
    })
    str += `总计：$${usedTotal.toFixed(2)}/$${grantTotal.toFixed(2)} - ${(usedTotal / grantTotal * 100).toFixed(2)}%\n`
    await e.reply(str.trim())
}
async function openAIReply(promt, token) {
    const configuration = new Configuration({
        apiKey: token,
    });
    const openai = new OpenAIApi(configuration);
    console.log(calculatePromtLength(promt))
    console.log(token)
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: promt,
        temperature: 1,
        max_tokens: 3000 - calculatePromtLength(promt),
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: ["【【"]
    });
    return response.data.choices[0].text
}
async function openAIReply35(messages, token) {
//    const data = await axios({
    const payload = {
        url: "https://api.openai.com/v1/chat/completions",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
        },
        "method": "POST",
        "data": {
            "model": "gpt-3.5-turbo",
            // "temperature": 1,
            // "max_tokens": 3000 - messages.length,
            "messages": messages.data
        }
    }
    const data = await axios(payload).catch(err => console.log(err.response))
    let res = data.data.choices[0].message.content
    res = res.replace(/^.*?】】/, '')
    return res
}
async function reply(e, token, promt) {
    lastUsedTime[token] = Date.now()
    try {
        console.log("Generating message...")
        const result: any = await openAIReply35(promt, token)
        console.log("Message generated!")
        console.log("Message: " + result)
        await e.reply(result.trim())
        if (e.message_type === "group") addToGroupMessage(e)
        else addToPrivateMessage(e)
        if (e.message_type === "group") {
            addToGroupMessage({
                sender: { nickname: "olight" },
                raw_message: result.trim(),
                group_id: e.group_id,
            })
        } else {
            addToPrivateMessage({
                sender: { nickname: "olight", user_id: e.sender.user_id, },
                raw_message: result.trim(),
            })
        }
    } catch (err) {
        // if (e.message_type === "group") addToGroupMessage(e)
        // else addToPrivateMessage(e)
        console.log(err.toString())
        lastUsedTime[token] = 0
        if (err.toString().includes('429')) {
            avaliableToken[token] = false
            console.log("Token used up: " + token)
            handleTask(e, promt)
            return
        }
    }
}

async function handleTask(e, promt) {
  // 按上次使用时间排序
  const tokens = [...multiToken].filter(x => avaliableToken[x] !== false).sort((a, b) => lastUsedTime[a] - lastUsedTime[b])
  if (!tokens.length) {
    addToGroupMessage(e)
    e.reply("No avaliable token found.")
    console.log("No avaliable token found.")
    return
  }
  const earliestToken = tokens.reduce((a, b) => lastUsedTime[a] < lastUsedTime[b] ? a : b)
  setTimeout(() => reply(e, earliestToken, promt), 6000 - (Date.now() - lastUsedTime[earliestToken]))
}
function addToGroupMessage(e) {
    if (group_messages[e.group_id] === undefined) {
        group_messages[e.group_id] = []
    }
    group_messages[e.group_id].push(e)
    if (group_messages[e.group_id].length > msgMaxLength) {
        group_messages[e.group_id].shift()
    }
}
function addToPrivateMessage(e) {
    if (private_messages[e.sender.user_id] === undefined) {
        private_messages[e.sender.user_id] = []
    }
    private_messages[e.sender.user_id].push(e)
    if (private_messages[e.sender.user_id].length > msgMaxLength) {
        private_messages[e.sender.user_id].shift()
    }
}
const avaliableToken = {}
let countToken = {}
const lastUsedTime = {}
export default new Middleware({
    name: 'gpt3',
    job: async (e, client, next) => {
        if (e.message_type === 'group') {
            try {
                // if not in whitelist, return
                if (group_whitelist[e.group_id] === undefined || !group_whitelist[e.group_id]()) {
                    return
                }
                if (admin_list[e.sender.user_id] && e.raw_message.trim() === "/reset") {
                    group_messages[e.group_id] = []
                    await client.sendGroupMsg(e.group_id, "重置成功！")
                    return
                }
                if (e.raw_message.trim() === "/usage") {
                    await replyUsage(e)
                    return
                }
                // if @ bot or msg starts with "!"
                if (e.raw_message.startsWith("！") || e.raw_message.startsWith(";") || e.raw_message.startsWith("；") || e.raw_message.startsWith("!") || e.message.some(x => x.type === "at" && x.qq === config.account)) {
                    const message = [...(group_messages[e.group_id] || [])]
                    message.push(e)
                    const promt = getPromtFor35(e, message)
                    // const promt = getPromt(e, message)
                    console.log(getPromtFor35(e, message))
                    if (promt === null) {
                        e.reply('Sorry, your message is too long.')
                        return
                    }
                    handleTask(e, promt)
                } else {
                    addToGroupMessage(e)
                }
            } catch (e) {
                console.log(e)
            }
        } else {
            try {
                // private_whitelist
                if (!private_whitelist[e.sender.user_id]) {
                    return
                }
                if (e.raw_message.trim() === "/reset") {
                    private_messages[e.sender.user_id] = []
                    await client.sendPrivateMsg(e.sender.user_id, "重置成功！")
                    return
                }
                if (e.raw_message.trim() === "/usage") {
                    await replyUsage(e)
                    return
                }
                const messages = [...(private_messages[e.sender.user_id] || [])]
                messages.push(e)
                const promt = getPromt(e, messages)
                if (promt === null) {
                    e.reply('Sorry, your message is too long.')
                    return
                }
                handleTask(e, promt)
            } catch (e) {
                console.log(e)
            }
        }
        await next()
    }
})
