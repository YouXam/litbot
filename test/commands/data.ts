import { Command } from '../../src/index'
export default new Command({
    name: 'data',
    description: '存储或读取数据, 仅保存在内存中',
    subcommands: [
        new Command({
            name: 'set',
            description: '存储数据',
            args: [
                {
                    name: '键',
                    argType: 'positional',
                    description: '数据键',
                    dataType: 'string',
                    required: true
                },
                {
                    name: '值',
                    argType: 'positional',
                    description: '数据值',
                    dataType:'any',
                    required: false
                },
                {
                    name: '全局',
                    alias: ['-g', '--global'],
                    argType: 'keyword',
                    description: '默认将数据存储在群空间中, 添加此开关后, 将数据存储在全局空间\n注意: 私聊或讨论组无群空间, 请使用全局空间',
                    dataType: 'boolean',
                    required: false,
                    defaultValue: false
                }
            ],
            job: async function (e, session, client) {
                const d = e.args['全局'] ? session.data.public : session.data.private
                if (!e.args['值']) return e.reply('缺少参数: 值', true)
                const data = e.args['值'] as string
                return e.reply(d[e.args['键'] as any] = data, true)
            }
        }),
        new Command({
            name: 'get',
            description: '读取数据',
            args: [
                {
                    name: '键',
                    argType: 'positional',
                    description: '数据键',
                    dataType: 'string',
                    required: true
                },
                {
                    name: '全局',
                    alias: ['-g', '--global'],
                    argType: 'keyword',
                    description: '默认将数据存储在群空间中, 添加此开关后, 将数据存储在全局空间\n注意: 私聊或讨论组无群空间, 请使用全局空间',
                    dataType: 'boolean',
                    required: false,
                    defaultValue: false
                }
            ],
            job: async function (e, session, client) {
                const d = e.args['全局'] ? session.data.public : session.data.private
                return e.reply(d[e.args['键'] as any] || '<找不到此键>', true)
            }
        })
    ]
})