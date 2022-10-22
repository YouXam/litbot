import { Middleware } from '../../src/index'

const bracket = {
    '(': ')',
    '<': '>',
    '[': ']',
    '{': '}',
    '【': '】',
    '（': '）',
    '「': '」',
    '＜': '＞',
    '《': '》',
    '『':'』',
    '〖': '〗'
}

const fBracket = {
    ')': '(',
    '>': '<',
    ']': '[',
    '}': '{',
    '】': '【',
    '）': '（',
    '」': '「',
    '＞': '＜',
    '》': '《',
    '』':'『',
    '〗': '〖`'
}


export default new Middleware({
    name: 'bracket',
    job: async (e, client, next) => {
        let stack: string[] = []
        let line = 1, col = 1;
        for (let i = 0; i < e.raw_message.length; i++) {
            if (bracket[e.raw_message[i]]) {
                stack.push(e.raw_message[i])
            } else if (fBracket[e.raw_message[i]]) {
                if (!stack.length) {
                    e.reply(`括号匹配错误：\n在第 ${line} 行第 ${col} 列，前面没有和 "${e.raw_message[i]}" 匹配的括号。`, true)
                    stack = []
                    break
                } else if (stack[stack.length - 1] !== fBracket[e.raw_message[i]]) {
                    e.reply(`括号匹配错误：\n在第 ${line} 行第 ${col} 列，"${stack[stack.length - 1]}" 与 "${e.raw_message[i]}" 不匹配。`, true)
                    stack = []
                    break
                } else {
                    stack.pop()
                }
            }
            if (e.raw_message[i] === '\n') {
                line++;
                col = 1;
            } else {
                col++;
            }
        }
        if (stack.length)
            await e.reply(stack.reverse().map(e => bracket[e]).join(''), true)
        await next()
    }
})