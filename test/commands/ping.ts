import { MessageElem } from "icqq"
import { Command } from '../../src/index'

export default new Command({
    name: 'ping',
    description: '测试机器人运行状况',
    args: [
        {
            name: '消息',
            argType: 'positional',
            required: false,
            dataType: 'any',
            defaultValue: 'Pong!',
            description: '机器人将会重复发送的消息'
        },
        {
            name: '延时',
            alias: ['--delay', '-d'],
            argType: 'keyword',
            required: false,
            dataType: 'number',
            defaultValue: 0,
            description: '响应延迟时间，单位为秒，最大延时为 10 秒'
        },
        {
            name: '时间',
            alias: ['--time', '-t'],
            argType: 'keyword',
            required: false,
            dataType: 'boolean',
            defaultValue: false,
            description: '在输出中附加服务器时间'
        }
    ],
    job: async (e, s, c) => {
        const msg = typeof e.args['消息'] === 'object' ? e.args['消息'] : (e.args['消息'] as any || '').toString()
        const result: (string | MessageElem)[] = [ msg  || 'Pong!', `${e.args['时间'] ? '\n' + (new Date()).toLocaleString() : ''}`]
        if (e.args['延时']) {
            if (e.args['延时'] > 10) e.args['延时'] = 10
            setTimeout(() => {
                e.reply(result)
            }, (e.args['延时'] as number) * 1000)
        } else e.reply(result)
    }
})