import { Command } from '../../src/index'
import axios from 'axios'

async function getData() {
    const loc = await axios.get('https://youth.bupt.edu.cn/nuclear/api/getloc')
    const loclist = loc.data.loclist
    const shLocList = Object.keys(loclist).filter((item: any) => item.startsWith('沙河'))
    const jobs = shLocList.map((item: any) => axios.get(`https://youth.bupt.edu.cn/nuclear/api/get?locate=${loclist[item]}`))
    const res = await Promise.all(jobs)
    const data = res.map((item: any) => item.data)
    // shLoclist is key, data is value
    const shLocData = shLocList.reduce((acc: any, cur: any, index: any) => {
        acc[cur] = data[index]
        return acc
    }, {})
    return shLocData
}
export default new Command({
    name: 'ncov',
    description: '查询核酸点附近人数，数据来源于 nuclear.byrio.work',
    job: async function (e, s, c)  {
        const data = s.data.public
        if (data.ncov && Date.now() - (new Date(data.ncov.time as number).getTime()) < 5 * 60 * 1000) {
            await s.send(data.ncov.message)
            return
        }
        let res = await getData()
        // 按照人数多少升序排序
        const sorted = Object.keys(res).sort((a, b) => res[a].count - res[b].count)
        const resText = sorted.map((item: any) => {
            const data = res[item].count
            return `${item}: ${data} 人`
        }).join('\n')
        if (Object.keys(res).every(e => res[e].time === "")) {
            // 维护中
            data.ncov = {
                time: Date.now() - 4 * 60 * 1000,
                message: '源网站 nuclear.byrio.work 维护中，请稍后再试'
            }
        } else {
            const time = Math.min(...Object.keys(res).map((item: any) => (new Date(res[item].time)).getTime()))
            const message = [
                '核酸点附近人数: \n',
                resText,
                '\n数据来源于 nuclear.byrio.work (' + new Date(time).toLocaleString() + ')',
            ]
            data.ncov = {
                time,
                message
            }
        }
        await s.send(data.ncov.message)
    },
    groupWhitelist:{
        681338941: true,
        715207945: true,
    }
})