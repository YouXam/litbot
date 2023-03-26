import { MessageElem } from "icqq"
import { Command } from '../../src/index'
import axios from 'axios'

export default new Command({
    name: 'short',
    description: '转成短链接',
    args: [
        {
            name: 'link',
            argType: 'positional',
            required: false,
            dataType: 'string',
            description: '链接'
        }
    ],
    job: async (e, s, c) => {
        const linkReg = /^(http|https):\/\/([\w.]+\/?)\S*/
        const link = e.args['link'] as string
        if (!link || !linkReg.test(link)) {
            e.reply('请输入正确的链接')
            return
        }
        const res = await axios({
            method: 'post',
            url: 'https://yxm.pl',
            data: {
                url: link
            }
        })
        if (res.status === 200) {
            e.reply('短链接：' + res.data.shortUrl)
        } else {
            e.reply('短链接生成失败')
        }
    }
})