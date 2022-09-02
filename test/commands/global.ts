import { Command } from '../../src/index'
export default new Command({
    name: 'global',
    description: '输出全局变量',
    job: async function (e, s, c)  {
        await s.send(JSON.stringify(s.data.global, null, '  '))
    }
})