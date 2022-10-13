import { Client, DiscussMessageEvent, GroupAdminEvent, GroupMessageEvent, MessageElem, MessageRet, PrivateMessageEvent, Sendable } from "oicq"

export interface SessionPort {
    type: 'private' | 'group' | 'discuss'
    group_id?: number
    discuss_id?: number
    account: number
}
type LitSessionsOfPerson = Map<number, Session>
type LitSessionOfGruop = Map<number, LitSessionsOfPerson>
export interface LitSessions {
    private: LitSessionOfGruop
    group: LitSessionOfGruop
    discuss: LitSessionOfGruop
}
export class Session {
    reply: Function = null
    inputCallback: Function = null
    inputError: Function = null
    port: SessionPort = null
    sessions: LitSessions = null
    client: Client = null
    e: GroupMessageEvent | DiscussMessageEvent | PrivateMessageEvent = null
    data: {
        private: { [ key: string ]: any },
        public: { [ key: string ]: any },
        global: { [ key: string ]: any }
    } = null
    constructor(s: LitSessions, data: any, client: Client, e: GroupMessageEvent | DiscussMessageEvent | PrivateMessageEvent) {
        this.port = {
            type: e.message_type,
            group_id: (e as GroupMessageEvent).group_id,
            discuss_id: (e as DiscussMessageEvent).discuss_id,
            account: e.sender.user_id
        }
        this.data = data
        this.reply = function (...args: any[]) {
            e.reply.apply(e, args)
        }, 
        this.sessions = s
        this.client = client
        this.e = e
    }
    recv(): Promise<PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent> {
        return this.recvFrom(this.port)
    }
    recvFrom(port: SessionPort): Promise<PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent> {
        if (!this.sessions[port.type]) this.sessions[port.type] = new Map()
        let typem2 = this.sessions[port.type].get(port.discuss_id || port.group_id || -1)
        if (!typem2) typem2 = new Map()
        let typem3 = typem2.get(port.account)
        if (!typem3) typem3 = this
        typem2.set(port.account, typem3)
        this.sessions[port.type].set(port.discuss_id || port.group_id || -1, typem2)
        return new Promise((res, rej) => {
            this.inputCallback = res
            this.inputError = rej
        })
    }
    async send(e: Sendable, quote: boolean = false): Promise<void | MessageRet> {
        if (quote) {
            return await this.reply(e, quote || false)
        }
        if (this.port.type == 'group') {
            return await this.client.sendGroupMsg(this.port.group_id, e)
        } else if (this.port.type == 'discuss') {
            return await this.client.sendDiscussMsg(this.port.discuss_id, e)
        }
        return await this.client.sendPrivateMsg(this.port.account, e)
    }
}