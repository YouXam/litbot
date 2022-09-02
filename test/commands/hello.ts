import { Command } from '../../src/index'
export default new Command({
    name: 'hello',
    description: '以会话形式输入姓名并回复欢迎信息',
    job: async function (e, s, c)  {
        await s.send('请输入姓名:')
        const name = await s.recv()
        await s.send(['你好, ', ...name.message])
    }
})