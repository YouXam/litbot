import { MessageElem, segment } from "icqq"
import { Command } from '../../src/index'

export default new Command({
    name: 'rut',
    description: '随机发情',
    args: [
        {
            name: '目标',
            argType: 'positional',
            required: false,
            dataType: 'at',
            defaultValue: 'random',
            description: '发情目标'
        }
    ],
    job: async (e, s, c) => {
        if (e.message_type !== 'group') return
        let target
        if (e.args['目标'] && e.args['目标'] !== 'random') {
            target = e.args['目标']
        } else {
            const list = [...(await e.group.getMemberMap()).keys()]
            target = list[Math.ceil(Math.random() * list.length)]
        }
        await e.reply([segment.at(target), '🤤🤤🤤'])
    },
    groupWhitelist: {
        833938858: true,
        715207945: true,
        729471015: true,
    }
})