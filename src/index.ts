import { Client, createClient, DiscussMessageEvent, Group, GroupMessageEvent, MessageElem, PrivateMessageEvent, TextElem } from "oicq"
import { Session, LitSessions } from "./session"
import * as clearModule from 'clear-module'
import { fstat, watch } from 'fs'
import * as cron from 'node-cron'
import { Db, MongoClient } from 'mongodb'
import * as colors from 'colors-console'
import { config } from "process"
export { Client, createClient, Config, Logger, LogLevel, Statistics } from "oicq"
export { User, Friend } from "oicq"
export { Discuss, Group } from "oicq"
export { Member } from "oicq"
export { StrangerInfo, FriendInfo, GroupInfo, MemberInfo } from "oicq"
export { Gfs, GfsDirStat, GfsFileStat } from "oicq"
export { Gender, GroupRole, OnlineStatus } from "oicq"
export { ErrorCode, LoginErrorCode } from "oicq"
export { Message, PrivateMessage, GroupMessage, DiscussMessage, ForwardMessage, Forwardable, Quotable, MusicPlatform, Sendable, Anonymous, MessageElem, FileElem, ReplyElem, TextElem, AtElem, FaceElem, BfaceElem, MfaceElem, ImageElem, MiraiElem, FlashElem, PttElem, VideoElem, XmlElem, JsonElem, ShareElem, LocationElem, PokeElem, parseDmMessageId, parseGroupMessageId, parseImageFileParam, getGroupImageUrl, segment } from "oicq"
export { PrivateMessageEvent, GroupMessageEvent, DiscussMessageEvent, MessageRet, MessageEvent, RequestEvent, FriendNoticeEvent, GroupNoticeEvent, FriendRequestEvent, GroupRequestEvent, GroupInviteEvent, EventMap, FriendIncreaseEvent, FriendDecreaseEvent, FriendRecallEvent, FriendPokeEvent, MemberIncreaseEvent, MemberDecreaseEvent, GroupRecallEvent, GroupPokeEvent, GroupAdminEvent, GroupMuteEvent, GroupTransferEvent } from "oicq"
export { ApiRejection, Device, Apk, Platform, Domain } from "oicq"
export * as core from "oicq"
export { OcrResult } from "oicq"
interface LitPrivateMessageEvent extends PrivateMessageEvent {
    args: { [key: string]: string | boolean | number | object }
}
interface LitGroupMessageEvent extends GroupMessageEvent {
    args: { [key: string]: string | boolean | number | object }
}
interface LitDiscussMessageEvent extends DiscussMessageEvent {
    args: { [key: string]: string | boolean | number | object }
}
interface Argument {
    name: string
    description: string
    required: boolean
    defaultValue?: string | number | boolean
}
interface KeywordArgument extends Argument {
    alias?: string[]
    dataType: 'string' | 'number' | 'boolean'
    argType: 'keyword'
}
interface PositionalArgument extends Argument {
    dataType: 'string' | 'number' | 'boolean' | 'at' | 'any'
    argType: 'positional'
}
interface _Crontab {
    cronstr: string
    name: string
    job: (client: Client, data: Object) => Promise<void>;
}
export class Crontab implements _Crontab {
    cronstr: string
    name: string
    job: (client: Client, data: Object) => Promise<void>;
    constructor(info: _Crontab) {
        this.name = info.name
        this.cronstr = info.cronstr
        this.job = info.job
    }
}

interface _Middleware {
    name: string
    /** 群白名单 */
    groupWhitelist?: { [key: number]: boolean }
    /** 人白名单 */
    userWhitelist?: { [key: number]: boolean }
    job: (e: LitPrivateMessageEvent | LitGroupMessageEvent | LitDiscussMessageEvent, client: Client, next: () => Promise<void>) => Promise<void>
}

export class Middleware implements _Middleware {
    name: string
    groupWhitelist = null
    userWhitelist = null
    job: (e: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent, client: Client, next: () => Promise<void>) => Promise<void>
    constructor(info: _Middleware) {
        this.name = info.name
        this.job = info.job
        if (info.groupWhitelist) {
            this.groupWhitelist = info.groupWhitelist
        }
        if (info.userWhitelist) {
            this.userWhitelist = info.userWhitelist
        }
    }
}

interface _Command {
    /** 命令名称, 为用户使用时输入的内容 */
    readonly name: string
    /** 命令描述 */
    description: string
    /** 命令使用帮助, 若为空则自动生成 */
    usage?: string
    /** 参数列表 */
    args?: Array<KeywordArgument | PositionalArgument>
    /** 子命令列表 */
    subcommands?: Command[]
    /** 命令数据, 重载后不会被初始化 */
    data?: { [key: string]: any, db: Db }
    /** 特定群聊的数据 */
    __gData?: { [key: number]: any }
    /** 群白名单 */
    groupWhitelist?: { [key: number]: boolean }
    /** 人白名单 */
    userWhitelist?: { [key: number]: boolean }
    /** 初始化函数 */
    init?: () => Promise<void>
    /** 命令逻辑函数 */
    job?: (e: LitPrivateMessageEvent | LitGroupMessageEvent | LitDiscussMessageEvent, session: Session, client: Client) => Promise<any>
}
export class Command implements _Command {
    /** 命令名称, 为用户使用时输入的内容 */
    readonly name: string
    /** 命令描述 */
    description: string
    /** 命令使用帮助, 若为空则自动生成 */
    usage?: string
    /** 参数列表 */
    args?: Array<KeywordArgument | PositionalArgument>
    /** 子命令列表 */
    subcommands?: Command[]
    __subcommands?: { [key: string]: Command } = {}
    /** 命令数据, 重载后不会被初始化 */
    data?: { [key: string]: any, db: Db }
    /** 特定群聊的数据 */
    __gData?: { [key: number]: any }
    /** 群白名单 */
    groupWhitelist?: { [key: number]: boolean } = null
    /** 人白名单 */
    userWhitelist?: { [key: number]: boolean } = null
    init?: () => Promise<void>
    /** 命令逻辑函数 */
    job?: (e: LitPrivateMessageEvent | LitGroupMessageEvent | LitDiscussMessageEvent, session: Session, client: Client) => Promise<any>
    constructor(info: _Command) {
        this.name = info.name
        this.description = info.description
        this.usage = info.usage || null
        this.args = info.args || []
        this.subcommands = info.subcommands || []
        this.data = info.data || {
            db: null
        }
        this.init = info.init
        this.groupWhitelist = info.groupWhitelist || null
        this.userWhitelist = info.userWhitelist || null
        this.job = info.job
    }
}
export interface LitbotOptions {
    /** 机器人名称 */
    name: string,
    /** QQ 号 */
    account: number,
    /** QQ 密码 */
    password: string,
    /** 命令前缀 */
    prefix?: string,
    /** 群白名单 */
    groupWhitelist?: { [key: number]: boolean }
    /** 人白名单 */
    userWhitelist?: { [key: number]: boolean }
    /** 数据库 url */
    mongoUrl?: string
}
type LineArgument = boolean | (MessageElem & {
    text_type: 'quote' | 'normal'
})
/** 测试参数类型 */
function testType(type, value) {
    if (type === 'any') return [true, value]
    if (typeof value === 'object' && value.type === 'text' && value.text !== undefined) value = value.text
    const nil = [false, null], boolt = {
        true: true,
        false: false,
        yes: true,
        no: false,
        on: true,
        off: false,
        是: true,
        否: false,
        开: true,
        关: false,
        真: true,
        假: false,
        开启: true,
        关闭: false
    }
    if (type === 'string') {
        return typeof value !== 'string' ? nil : [true, value]
    }
    if (type === 'number') {
        return isNaN(value) || !value.length ? nil : [true, parseFloat(value)]
    }
    if (type === 'boolean') {
        return boolt[value] !== undefined ? [true, boolt[value]] : nil
    }
    if (type === 'at') {
        if (typeof value === 'object' && value.type === 'at') {
            if (value.qq == 'all') return [true, 0]
            return [true, value.qq]
        } else if (typeof value === 'string') {
            return isNaN(parseInt(value)) ? nil : [true, parseInt(value)]
        }
    }
    return nil
}
/** 返回命令帮助信息 */
function getUsage(cmd: Command, prefix: string, e: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent, upcommand?: Command, ): string {
    const positionalArguments = [], keywordArgument = []
    if (cmd.args === undefined) cmd.args = []
    if (!cmd.usage) {
        const ptypet = {
            'string': '文本',
            'number': '数字',
            'boolean': 'true/false, on/off...',
            'at': '@ 或 QQ号',
            'any': '任意格式'
        }, ktypet = {
            'string': ':文本',
            'number': ':数字',
            'boolean': ''
        }
        let subcommands = ''
        if (cmd.subcommands && cmd.subcommands.length) {
            for (const i of cmd.subcommands) {
                if (e.message_type == 'group' && i.groupWhitelist && !i.groupWhitelist[e.group_id] || i.userWhitelist && !i.userWhitelist?.[e.sender.user_id])
                    continue
                subcommands += ` ${i.name}: ${i.description}\n`
            }
        }
        for (const i of cmd.args) {
            if (i.argType === 'positional') {
                positionalArguments.push({
                    usage: i.name + '(' + (i.required ? '必须' : '可选') + '): ' + ptypet[i.dataType] + (i.defaultValue !== undefined ? '=' + i.defaultValue : ''),
                    ...i
                })
            } else if (i.argType === 'keyword') {
                const k = i.alias && i.alias.length && [...i.alias] || []
                k.push('--' + i.name)
                keywordArgument.push({
                    usage: k.join(', '),
                    ...i
                })
            }
        }
        return `${upcommand && upcommand.name + '.' || ''}${cmd.name}
  ${cmd.description}${subcommands.length ? '\n子命令\n' + subcommands : '\n'}用法
  ${prefix || ''}${upcommand && upcommand.name + ' ' || ''}${cmd.name} ${cmd.subcommands?.length ? '[子命令名]' : ''} [关键字参数] ${positionalArguments.map(x => x.required ? '<' + x.name + (x.defaultValue !== undefined ? '=' + x.defaultValue : '') + '>' : '[' + x.name + (x.defaultValue !== undefined ? '=' + x.defaultValue : '') + ']').join(' ')}` +
            (positionalArguments.length > 0 ? `\n位置参数
${positionalArguments.map(x => '  ' + x.usage + '\n    ' + x.description.split('\n').join('\n    ')).join('\n')}` : '') +
            (keywordArgument.length > 0 ? `\n关键字参数
${keywordArgument.map(x => '  ' + x.usage + ktypet[x.dataType] + (x.defaultValue !== undefined ? '=' + x.defaultValue : '') + '\n    ' + x.description.split('\n').join('\n  ')).join('\n')}` : '')
    }
    return cmd.usage
}
function log(forp: string, msg: string) {
    console.log(colors('green', '[' + (new Date()).toISOString().slice(0, 23) + '] [Litbot] [' + forp + '] - ') + msg)
}
function error(forp: string, msg: string) {
    console.log(colors('red', '[' + (new Date()).toISOString().slice(0, 23) + '] [Litbot] [' + forp + '] - ' + msg))
}
export class Litbot {
    __command_list: { [key: string]: Command } = {}
    __crontab_list: { [key: string]: any } = {}
    __middlewares: Middleware[] = []
    __middlewares_list: { [key: string]: any } = {}
    client: Client = null
    prefix: string = '.'
    name: string
    data: { [key: string]: any } = {}
    sessions: LitSessions = {
        private: null,
        group: null,
        discuss: null
    }
    db: Db
    dbClient: MongoClient = null
    option: LitbotOptions
    beginTime: Date = null
    totalMessage: number = 0
    totalCommand: number = 0
    constructor(option: LitbotOptions) {
        this.beginTime = new Date()
        console.log('Litbot (oicq encapsulation)')
        this.option = option
        this.prefix = option.prefix || '.'
        this.name = option.name
        this.client = createClient(option.account, {
            platform: 2
        })
        this.client.on('message', e => {
            this.totalMessage++
            let cur = -1
            const next = async () => {
                cur += 1
                if (cur >= this.__middlewares.length) this._handler(e)
                else {
                    try {
                        const middleware = this.__middlewares[cur]
                        if (e.message_type == 'group' && middleware.groupWhitelist && !middleware.groupWhitelist[e.group_id] || middleware.userWhitelist && !middleware.userWhitelist[e.sender.user_id]) { 
                            await next()
                        } else {
                            await middleware.job(e, this.client, next)
                        }
                    } catch (e) {
                        console.log(e)
                    }
                }
            }
            next()
        })
        if (option.mongoUrl) {
            this.dbClient = new MongoClient(option.mongoUrl)
            this.dbClient.connect().then(() => {
                log('database', 'Database connected.')
                this.db = this.dbClient.db('litbot')
                Object.values(this.__command_list).forEach((e: Command) => {
                    e.data.db = this.db
                    if (e.init) e.init()
                })
            })
        }
        this.client.on("system.login.slider", function (e) {
            console.log('\n网址请均在滑动验证助手(https://install.appcenter.ms/users/mzdluo123/apps/txcaptchahelper/distribution_groups/public)中访问。')
            console.log('验证完成之后若程序无反应，请重启程序。')
            console.log("输入ticket：")
            process.stdin.once("data", ticket => this.submitSlider(String(ticket).trim()))
        }).login(option.password)
        this.command({
            name: 'help',
            description: '显示机器人帮助',
            job: async (e, client) => {
                const list = []
                let c = 1
                for (const key of Object.keys(this.__command_list)) {
                    const cmd = this.__command_list[key]
                    if (e.message_type == 'group' && cmd.groupWhitelist && !cmd.groupWhitelist[e.group_id] || cmd.userWhitelist && !cmd.userWhitelist?.[e.sender.user_id])
                        continue
                    list.push(`${c++}. ${key}: ${cmd.description}`)
                }
                return e.reply(this.name + ' 帮助\n请在所有命令前添加前缀 ' + this.prefix + '\n' + list.join('\n'), true)
            }
        })
        this.command({
            name: 'stat',
            description: '机器人状态',
            job: async (e, client) => {
                const elasped = (new Date().getTime() - this.beginTime.getTime()) / 1000
                const uptime = Math.floor(elasped / 86400) + '天' + Math.floor(elasped % 86400 / 3600) + '小时' + Math.floor(elasped % 3600 / 60) + '分' + Math.floor(elasped % 60) + '秒'
                const totalCommand = this.totalCommand
                const totalMessage = this.totalMessage
                const totalCommandPerHour = Math.floor(totalCommand / Math.ceil(elasped / 3600))
                const totalMessagePerHour = Math.floor(totalMessage / Math.ceil(elasped / 3600))
                return e.reply(`机器人运行时间：${uptime}\n接收到消息：${totalMessage} 条\n已处理命令：${totalCommand} 条\n平均每小时接收消息：${totalMessagePerHour} 条\n平均每小时处理命令：${totalCommandPerHour} 条`, true)
            }
        })
    }
    async _handler(e: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent) {
        try {
            if (e.message_type == 'group' && this.option.groupWhitelist && !this.option.groupWhitelist[e.group_id] || this.option.userWhitelist && !this.option.userWhitelist?.[e.sender.user_id]) {
                return
            }
            if (this.sessions[e.message_type]) {
                const id = (e as DiscussMessageEvent).discuss_id || (e as GroupMessageEvent).group_id || -1
                const a = this.sessions[e.message_type].get(id)
                if (a) {
                    const b = a.get(e.sender.user_id)
                    if (b) {
                        b.inputCallback(e)
                        a.set(e.sender.user_id, null)
                        this.sessions[e.message_type].set(id, a)
                        return
                    }
                }
            }
            if (!e.raw_message.startsWith(this.prefix)) return
            // parse arguments
            let cmd = '', message = []
            const kargs: { [key: string]: LineArgument } = {}, pargs: Array<LineArgument> = []
            for (const i of e.message) {
                if (i.type === 'text') {
                    const t = []
                    let lquote = '', last = '', last_type = 'normal', tran = -2
                    const trant = {
                        n: '\n',
                        t: '\t',
                        r: '\r',
                        b: '\b',
                        f: '\f',
                        '\\': '\\'
                    }
                    for (let k = 0; k < i.text.length; k++) {
                        const j: string = i.text[k] as string
                        if (j === '\\' && lquote.length && k - 1 !== tran) tran = k
                        else if (/\s/.test(j) && !lquote.length) {
                            if (last.length) {
                                t.push({ type: last_type, text: last })
                                last = ''
                                last_type = 'normal'
                            }
                        } else if (k - 1 !== tran && (j === '"' || j === "'")) {
                            if (lquote === '') {
                                lquote = j
                                if (k && /\s/.test(i.text[k - 1])) last_type = 'quote'
                            } else if (lquote === j) lquote = ''
                            else last += j
                        } else if (k - 1 === tran && (j === '"' || j === "'")) {
                            last += j
                        } else if (k - 1 === tran && trant[j] !== undefined) last += trant[j]
                        else if (k - 1 === tran) last += '\\' + j
                        else last += j
                    }
                    if (!/^\s*$/.test(last)) t.push({ type: last_type, text: last })
                    t.forEach(e => message.push({
                        type: 'text',
                        text: e.text,
                        text_type: e.type
                    }))
                } else message.push(i)
            }
            for (const i of message) {
                if (i.type !== 'text' || i.type === 'text' && i.text_type === 'quote') pargs.push(i)
                else if (i.text.startsWith('--')) {
                    const p = i.text.indexOf('=')
                    if (p > 0) {
                        const k = i.text.substring(2, p)
                        const v = i.text.substring(p + 1)
                        kargs[k] = v
                    } else kargs[i.text.slice(2)] = true
                } else if (i.text.startsWith('-') && /^-[^\d]$/.test(i.text)) {
                    const p = i.text.indexOf('=')
                    let last = ''
                    for (let j = 1; j < i.text.length; j++) {
                        const k = i.text[j]
                        if (k !== '=') {
                            kargs[k] = true
                            last = k
                        } else {
                            kargs[last] = i.text.substring(j + 1)
                            break
                        }
                    }
                } else if (!cmd.length) cmd = i.text
                else pargs.push(i)
            }
            if (cmd.indexOf(this.prefix) === 0) cmd = cmd.slice(this.prefix.length)
            let command = this.__command_list[cmd]
            if (!command) return
            let upcommand = null
            if (pargs.length > 0 && typeof (pargs[0]) !== 'boolean' && pargs[0].type === 'text') {
                const subcommand = command.__subcommands[pargs[0].text]
                if (subcommand && !(e.message_type == 'group' && subcommand.groupWhitelist && !subcommand.groupWhitelist[e.group_id]) && !(subcommand.userWhitelist && !subcommand.userWhitelist?.[e.sender.user_id])) {
                    upcommand = command
                    command = subcommand
                }
            }
            if (upcommand) pargs.shift()
            if (e.message_type == 'group' && command?.groupWhitelist && !command?.groupWhitelist[e.group_id] || command?.userWhitelist && !command?.userWhitelist?.[e.sender.user_id]) {
                return
            }
            if (e.message_type == 'group' && upcommand?.groupWhitelist && !upcommand?.groupWhitelist[e.group_id] || upcommand?.userWhitelist && !upcommand?.userWhitelist?.[e.sender.user_id]) {
                return
            }
            if (kargs.help || kargs.h) {
                return e.reply(getUsage(command, this.prefix, e, upcommand), true)
            }
            const args = {}, errorTypes = []
            let parg_cur = 0
            for (const i of command.args) {
                if (i.defaultValue) args[i.name] = i.defaultValue
                if (i.argType === 'positional') {
                    if (parg_cur < pargs.length) {
                        const v = testType(i.dataType, pargs[parg_cur++])
                        if (v[0]) args[i.name] = v[1]
                        else errorTypes.push(i.name)
                    } else if (i.required) {
                        return e.reply(`${i.name} 是必须参数，但是没有提供`, true)
                    }
                } else {
                    for (const j of i.alias) {
                        const tmp = kargs[j.replace(/^-+/, '')]
                        if (tmp !== undefined) {
                            const v = testType(i.dataType, (tmp as any).text || tmp)
                            if (v[0]) args[i.name] = v[1]
                            else errorTypes.push(i.name)
                            break
                        }
                    }

                }
            }
            if (errorTypes.length > 0) {
                return e.reply(`参数 ${errorTypes.join(', ')} 格式错误`, true)
            }
            if (command.job) {
                console.log((upcommand ? upcommand.name + '.' : '') + command.name, '开始运行')
                const curcommand = upcommand || command
                if (e.message_type === 'group' && !curcommand.__gData[e.group_id]) curcommand.__gData[e.group_id] = {}
                const _session = new Session(this.sessions, {
                    public: curcommand.data,
                    private: e.message_type === 'group' ? curcommand.__gData[e.group_id] : null,
                    global: this.data
                }, this.client, e)
                try {
                    this.totalCommand++
                    await command.job({
                        args,
                        ...e
                    } as (LitDiscussMessageEvent | LitGroupMessageEvent | LitPrivateMessageEvent), _session, this.client)
                } catch (e) {
                    error('command.' + curcommand.name, e.message || e.toString())
                }
            } else {
                e.reply('此命令下无函数逻辑，请检查子命令', true)
                console.log((upcommand ? upcommand.name + '.' : '') + command.name, '未找到函数')
            }
        } catch (err) {
            console.log(err)
            return e.reply('Error: ' + JSON.stringify(err), true)
        }
    }
    async command(target: Command | string) {
        if (!target) return
        if (typeof (target) === 'string') {
            try {
                const res = await import(target)
                await this.command(res.default || res)
                watch(target, {}, async (e, f) => {
                    clearModule(target)
                    try {
                        const nm = await import(target)
                        this.command(nm.default || res)
                    } catch (e) {
                        console.log(e)
                    }
                })
            } catch (e) {
                console.log(e)
            }
            return
        }
        if (!target.name.length) throw new Error('缺少命令名字')
        if (!target.args) target.args = []
        let isrequired = true
        target.args.push({
            name: '帮助',
            argType: 'keyword',
            dataType: 'boolean',
            required: false,
            alias: ['-h', '--help'],
            description: '显示帮助信息',
            defaultValue: false
        })
        // 检查命令语法
        let ishelp = false
        for (const i of target.args) {
            if (i.argType === 'positional') {
                if (!i.required) {
                    isrequired = false
                } else if (!isrequired) {
                    error('command.' + target.name.toString() + '.' + i.name.toString(), '命令语法错误，位置参数中的必须参数必须在可选参数之前')
                    return
                }
            } else if (i.argType === 'keyword') {
                for (const j of i.alias) {
                    if (!(j.startsWith('--') && j.length >= 2) && !(j.startsWith('-') && j.length == 2)) {
                        error('command.' + target.name.toString() + '.' + i.name.toString(), '命令语法错误，请检查命令参数名称')
                        return
                    }
                }
            }
        }
        const last = this.__command_list[target.name]
        if (last) {
            target.data = last.data
            target.__gData = last.__gData
        } else {
            target.data = target.data || { db: null }
            if (!target.data.db) target.data.db = this.db
            target.__gData = {}
        }
        for (let i of target.subcommands || []) {
            target.__subcommands[i.name] = i
            target.__subcommands[i.name].data = target.data
        }
        this.__command_list[target.name] = target
        log('command.' + target.name, last ? '命令重新加载' : '命令已加载')
    }
    async commands(targets: Array<string | Command>) {
        await Promise.allSettled(targets.map(x => this.command(x)))
    }
    async crontab(target: Crontab | string) {
        if (typeof target === 'string') {
            const res = await import(target)
            await this.crontab(res.default || res)
            watch(target, {}, async (e, f) => {
                clearModule(target)
                try {
                    const nm = await import(target)
                    this.crontab(nm.default || res)
                } catch (e) {
                    console.log(e)
                }
            })
            return
        }
        if (!cron.validate(target.cronstr)) {
            error('crontab.' + target.name, 'crontab 表达式不合法')
            return
        }
        let last = false
        if (this.__crontab_list[target.name]) {
            last = true
            this.__crontab_list[target.name].stop()

        }
        log('crontab.' + target.name, last ? 'crontab 重新加载' : 'crontab 已加载')
        this.__crontab_list[target.name] = cron.schedule(target.cronstr, async () => {
            try {
                await target.job(this.client, this.data)
            } catch (e) {
                error('crontab.' + target.name, e.toString())
            }
        })
    }
    async crontabs(targets: Array<Crontab | string>) {
        await Promise.allSettled(targets.map(x => this.crontab(x)))
    }
    async middleware(target: Middleware | string) {
        if (typeof target === 'string') {
            const res = await import(target)
            await this.middleware(res.default || res)
            watch(target, {}, async (e, f) => {
                clearModule(target)
                try {
                    const nm = await import(target)
                    this.middleware(nm.default || res)
                } catch (e) {
                    console.log(e)
                }
            })
            return
        }
        let last = !!this.__middlewares_list[target.name]
        this.__middlewares_list[target.name] = true
        log('middleware.' + target.name, last ? 'middleware 重新加载' : 'middleware 已加载')
        if (last) {
            for (let i = 0; i < this.__middlewares.length; i++) {
                if (this.__middlewares[i].name == target.name) {
                    this.__middlewares[i] = target
                    break
                }
            }
        } else {
            this.__middlewares.push(target)
        }
    }
    async middlewares(targets: Array<Middleware | string>) {
        await Promise.allSettled(targets.map(x => this.middleware(x)))
    }
}
