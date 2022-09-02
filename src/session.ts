import { DiscussMessageEvent, GroupAdminEvent, GroupMessageEvent, MessageElem, PrivateMessageEvent, Sendable } from "oicq"

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
    data: {
        private: { [ key: string ]: any },
        public: { [ key: string ]: any },
        global: { [ key: string ]: any }
    } = null
    constructor(reply: Function, port: SessionPort, s: LitSessions, data: any) {
        this.data = data
        this.reply = reply
        this.port = port
        this.sessions = s
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
    async send(e: Sendable, quote?: boolean) {
        await this.reply(e, quote || false)
    }
}