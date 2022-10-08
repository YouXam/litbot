import { Middleware } from '../../src/index'

export default new Middleware({
    name: 'bracket',
    job: async (e, client, next) => {
        if (e.raw_message.indexOf('(') !== -1 || e.raw_message.indexOf(')') !== -1 || e.raw_message.indexOf('）') !== -1 || e.raw_message.indexOf('（') !== -1) {
            let k = 0
            for (let i = 0; i < e.raw_message.length; i++) {
                if (e.raw_message[i] == '(' || e.raw_message[i] == '（') {
                    k++
                } else if (e.raw_message[i] == ')' || e.raw_message[i] == '）') {
                    k--
                    if (k < 0) {
                        e.reply('括号匹配错误!!', true)
                        await next()
                        break
                    }
                }
            }
            if (k > 0) e.reply(')'.repeat(k), true)
        }
        await next()
    }
})