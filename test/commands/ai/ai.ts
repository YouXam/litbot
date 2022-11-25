import { Command, segment,  } from '../../../src/index'
import { getImage, getPrice, Config, getAnlas } from './spider'
import { AtElem, MessageElem, MessageRet, TextElem } from 'oicq'
import config from './config'
import * as fsp from 'fs/promises'
export default new Command({
    name: 'ai',
    description: 'ai 绘图',
    async init() {
        this.data.config = await this.data.db.collection('aiConfig')
        this.data.users = await this.data.db.collection('aiUsers')
        const res = await this.data.config.findOne({ 'type': 'main' })
        if (!res) {
            await this.data.config.insertOne({
                type: 'main',
                anlas: 0
            })
        }
    },
    subcommands: [
        // tti
        new Command({
            name: 'tti',
            description: '文本转图片',
            args: [
                {
                    name: '文本',
                    argType: 'positional',
                    required: true,
                    dataType: 'string',
                    description: '对图片的描述文本，详见 https://docs.novelai.net/image/basics.html'
                },
                {
                    name: '过滤内容',
                    argType: 'keyword',
                    required: false,
                    dataType: 'string',
                    alias: ['--undesired-content', '-u'],
                    description: '需要过滤的内容(Undesired Content)'
                },
                {
                    name: '采样器',
                    argType: 'keyword',
                    required: false,
                    alias: ['--sampler', '-s'],
                    dataType: 'string',
                    description: '模型采样器: k_euler_ancestral(默认), keuler, k_Ims, plms, ddim',
                },
                {
                    name: '图片尺寸',
                    argType: 'keyword',
                    required: false,
                    alias: ['--orient', '-o'],
                    dataType: 'string',
                    description: '图片尺寸: landscape(横), portrait(竖, 默认), square(方)'
                },
                {
                    name: '种子',
                    argType: 'keyword',
                    required: false,
                    alias: ['--seed', '-d'],
                    dataType: 'number',
                    description: '随机种子，默认以当前时间为种子'
                },
                {
                    name: '相关性',
                    argType: 'keyword',
                    required: false,
                    alias: ['--scale', '-e'],
                    dataType: 'number',
                    description: '图片与文本的相关性，越大越有关，默认为 12'
                },
                {
                    name: '迭代次数',
                    argType: 'keyword',
                    required: false,
                    alias: ['--step', '-p'],
                    dataType: 'number',
                    description: '迭代次数越大，效果越好，默认为 33'
                },
                {
                    name: '使用公用账户',
                    argType: 'keyword',
                    required: false,
                    alias: ['--global', '-g'],
                    dataType: 'boolean',
                    description: '使用公用账户'
                }
            ],
            async job(e, session, client) {
                const userid = e.args['使用公用账户'] ? 0 : e.sender.user_id
                const user = await this.data.users.findOne({ qid: userid })
                const data = await this.data.config.findOne({ type: 'main' })
                if (!user || !user?.price || user.price <= 0) {
                    return session.send('点数不足, 当前余额 ' + (user?.price || 0) + ' 元', true)
                }
                const option: Config = {
                    model: e.message_type == 'private' ? 'safe-diffusion' : 'nai-diffusion',
                    input: e.args['文本'] as string,
                    sampler: e.args['采样器'] as string,
                    orient: e.args['图片尺寸'] as string,
                    seed: e.args['种子'] as number,
                    scale: e.args['相关性'] as number,
                    steps: e.args['迭代次数'] as number,
                    uc: e.args['过滤内容'] as string
                }
                const begin = new Date()
                const sid = (await session.send('请稍等...')) as MessageRet
                const res = await Promise.allSettled([
                    getPrice(option),
                    getImage(option)
                ])
                if (res[0].status == 'fulfilled' && res[1].status == 'fulfilled') {
                    const cost = res[0].value.costPerPrompt * res[0].value.numPrompts
                    const filename =  Buffer.from(e.message_id).toString('base64') + '.png'
                    await fsp.writeFile(filename, Buffer.from(res[1].value, 'base64'))
                    await session.send([segment.image(filename)])
                    const costPrice = cost / data.anlas * data.price
                    data.anlas -= cost
                    data.price -= costPrice
                    user.price -= costPrice
                    this.data.config.updateOne({ type: 'main' }, { $set: data })
                    delete user._id
                    this.data.users.updateOne({ qid: userid }, { $set: user })
                    const costTime = ((new Date).getTime() - begin.getTime()) / 1000
                    await session.send((e.args['使用公用账户'] ? '<公用账户>' : e.sender.nickname) + ' 消耗 ' + cost + ' 点(' + costPrice.toFixed(4) + '元), 剩余 ' + user.price.toFixed(4) + ' 元, 耗时 ' + costTime.toFixed(1) + ' 秒。', true)
                    client.deleteMsg(sid.message_id)
                    fsp.unlink(filename)
                    const anlas = await getAnlas()
                    this.data.config.updateOne({ type: 'main' }, { $set: { anlas } })
                } else {
                    let reason = ''
                    if (res[0].status == 'rejected' && res[1].status == 'rejected') reason = 'getPrice: ' + res[0].reason.toString() + '\n' + 'getImage: ' + res[1].reason.toString() 
                    else if (res[0].status == 'rejected') reason = 'getPrice: ' + res[0].reason.toString()
                    else if (res[1].status == 'rejected') reason = 'getImage: ' + res[1].reason.toString()
                    session.send('错误:\n' + reason)
                }
            }
        }),
        // enhance
        new Command({
            name: 'enhance',
            description: '增强图片',
            args: [
                {
                    name: '文本',
                    argType: 'positional',
                    required: false,
                    defaultValue: '',
                    dataType: 'string',
                    description: '对图片的描述文本，详见 https://docs.novelai.net/image/basics.html'
                },
                {
                    name: '采样器',
                    argType: 'keyword',
                    required: false,
                    alias: ['--sampler', '-s'],
                    dataType: 'string',
                    description: '模型采样器: k_euler_ancestral(默认), keuler, k_Ims, plms, ddim',
                },
                {
                    name: '过滤内容',
                    argType: 'keyword',
                    required: false,
                    dataType: 'string',
                    alias: ['--undesired-content', '-u'],
                    description: '需要过滤的内容(Undesired Content)'
                },
                {
                    name: '图片尺寸',
                    argType: 'keyword',
                    required: false,
                    alias: ['--orient', '-o'],
                    dataType: 'string',
                    description: '图片尺寸: landscape(横), portrait(竖, 默认), square(方)'
                },
                {
                    name: '种子',
                    argType: 'keyword',
                    required: false,
                    alias: ['--seed', '-d'],
                    dataType: 'number',
                    description: '随机种子，默认以当前时间为种子'
                },
                {
                    name: '相关性',
                    argType: 'keyword',
                    required: false,
                    alias: ['--scale', '-e'],
                    dataType: 'number',
                    description: '图片与文本的相关性，越大越有关，默认为 12'
                },
                {
                    name: '迭代次数',
                    argType: 'keyword',
                    required: false,
                    alias: ['--step', '-p'],
                    dataType: 'number',
                    description: '迭代次数越大，效果越好，默认为 33'
                },
                {
                    name: '使用公用账户',
                    argType: 'keyword',
                    required: false,
                    alias: ['--global', '-g'],
                    dataType: 'boolean',
                    description: '使用公用账户'
                }
            ],
            async job(e, session, client) {
                const userid = e.args['使用公用账户'] ? 0 : e.sender.user_id
                const user = await this.data.users.findOne({ qid: userid })
                const data = await this.data.config.findOne({ type: 'main' })
                if (!user || !user?.price || user.price <= 0) {
                    return session.send('点数不足, 当前余额 ' + (user?.price || 0) + ' 元', true)
                }
                await session.send('请发送图片:')
                const imgs = await session.recv()
                let imgUrl: string = ''
                for (let i of imgs.message) {
                    if (i.type == 'image' && typeof i.url === 'string') {
                        imgUrl = i.url
                        break
                    }
                }
                if (!imgUrl || !imgUrl.length) {
                    return session.send('图片格式不合法！')
                }
                const begin = new Date()
                const option: Config = {
                    model: e.message_type == 'private' ? 'safe-diffusion' : 'nai-diffusion',
                    input: e.args['文本'] as string,
                    sampler: e.args['采样器'] as string,
                    orient: e.args['图片尺寸'] as string,
                    seed: e.args['种子'] as number,
                    scale: e.args['相关性'] as number,
                    steps: e.args['迭代次数'] as number,
                    imgUrl: imgUrl,
                    enhance: true,
                    uc: e.args['过滤内容'] as string
                    
                }
                const sid = (await session.send('请稍等...')) as MessageRet
                const res = await Promise.allSettled([
                    getPrice(option),
                    getImage(option)
                ])
                if (res[0].status == 'fulfilled' && res[1].status == 'fulfilled') {
                    const cost = res[0].value.costPerPrompt * res[0].value.numPrompts
                    const filename =  Buffer.from(e.message_id).toString('base64') + '.png'
                    await fsp.writeFile(filename, Buffer.from(res[1].value, 'base64'))
                    await session.send([segment.image(filename)])
                    const costPrice = cost / data.anlas * data.price
                    data.anlas -= cost
                    data.price -= costPrice
                    user.price -= costPrice
                    this.data.config.updateOne({ type: 'main' }, { $set: data })
                    delete user._id
                    this.data.users.updateOne({ qid: e.sender.user_id }, { $set: user })
                    const costTime = ((new Date).getTime() - begin.getTime()) / 1000
                    await session.send(e.sender.nickname + ' 消耗 ' + cost + ' 点(' + costPrice.toFixed(4) + '元), 剩余 ' + user.price.toFixed(4) + ' 元, 耗时 ' + costTime.toFixed(1) + ' 秒。', true)
                    client.deleteMsg(sid.message_id)
                    fsp.unlink(filename)
                    const anlas = await getAnlas()
                    this.data.config.updateOne({ type: 'main' }, { $set: { anlas } })
                } else {
                    let reason = ''
                    if (res[0].status == 'rejected' && res[1].status == 'rejected') reason = 'getPrice: ' + res[0].reason.toString() + '\n' + 'getImage: ' + res[1].reason.toString() 
                    else if (res[0].status == 'rejected') reason = 'getPrice: ' + res[0].reason.toString()
                    else if (res[1].status == 'rejected') reason = 'getImage: ' + res[1].reason.toString()
                    session.send('错误:\n' + reason)
                }
            }
        }),
        // iti
        new Command({
            name: 'iti',
            description: '图片转图片',
            args: [
                {
                    name: '文本',
                    argType: 'positional',
                    required: false,
                    defaultValue: '',
                    dataType: 'string',
                    description: '对图片的描述文本，详见 https://docs.novelai.net/image/basics.html'
                },
                {
                    name: '采样器',
                    argType: 'keyword',
                    required: false,
                    alias: ['--sampler', '-s'],
                    dataType: 'string',
                    description: '模型采样器: k_euler_ancestral(默认), keuler, k_Ims, plms, ddim',
                },
                {
                    name: '图片尺寸',
                    argType: 'keyword',
                    required: false,
                    alias: ['--orient', '-o'],
                    dataType: 'string',
                    description: '图片尺寸: landscape(横), portrait(竖, 默认), square(方)'
                },
                {
                    name: '过滤内容',
                    argType: 'keyword',
                    required: false,
                    dataType: 'string',
                    alias: ['--undesired-content', '-u'],
                    description: '需要过滤的内容(Undesired Content)'
                },
                {
                    name: '种子',
                    argType: 'keyword',
                    required: false,
                    alias: ['--seed', '-d'],
                    dataType: 'number',
                    description: '随机种子，默认以当前时间为种子'
                },
                {
                    name: '相关性',
                    argType: 'keyword',
                    required: false,
                    alias: ['--scale', '-e'],
                    dataType: 'number',
                    description: '图片与文本的相关性，越大越有关，默认为 12'
                },
                {
                    name: '迭代次数',
                    argType: 'keyword',
                    required: false,
                    alias: ['--step', '-p'],
                    dataType: 'number',
                    description: '迭代次数越大，效果越好，默认为 33'
                },
                {
                    name: '使用公用账户',
                    argType: 'keyword',
                    required: false,
                    alias: ['--global', '-g'],
                    dataType: 'boolean',
                    description: '使用公用账户'
                }
            ],
            async job(e, session, client) {
                const userid = e.args['使用公用账户'] ? 0 : e.sender.user_id
                const user = await this.data.users.findOne({ qid: userid })
                const data = await this.data.config.findOne({ type: 'main' })
                if (!user || !user?.price || user.price <= 0) {
                    return session.send('点数不足, 当前余额 ' + (user?.price || 0) + ' 元', true)
                }
                await session.send('请发送图片:')
                const imgs = await session.recv()
                let imgUrl: string = ''
                for (let i of imgs.message) {
                    if (i.type == 'image' && typeof i.url === 'string') {
                        imgUrl = i.url
                        break
                    }
                }
                if (!imgUrl || !imgUrl.length) {
                    return session.send('图片格式不合法！')
                }
                const begin = new Date()
                const option: Config = {
                    model: e.message_type == 'private' ? 'safe-diffusion' : 'nai-diffusion',
                    input: e.args['文本'] as string,
                    sampler: e.args['采样器'] as string,
                    orient: e.args['图片尺寸'] as string,
                    seed: e.args['种子'] as number,
                    scale: e.args['相关性'] as number,
                    steps: e.args['迭代次数'] as number,
                    imgUrl: imgUrl,
                    uc: e.args['过滤内容'] as string
                }
                const sid = (await session.send('请稍等...')) as MessageRet
                const res = await Promise.allSettled([
                    getPrice(option),
                    getImage(option)
                ])
                if (res[0].status == 'fulfilled' && res[1].status == 'fulfilled') {
                    const cost = res[0].value.costPerPrompt * res[0].value.numPrompts
                    const filename =  Buffer.from(e.message_id).toString('base64') + '.png'
                    await fsp.writeFile(filename, Buffer.from(res[1].value, 'base64'))
                    await session.send([segment.image(filename)])
                    const costPrice = cost / data.anlas * data.price
                    data.anlas -= cost
                    data.price -= costPrice
                    user.price -= costPrice
                    this.data.config.updateOne({ type: 'main' }, { $set: data })
                    delete user._id
                    this.data.users.updateOne({ qid: e.sender.user_id }, { $set: user })
                    const costTime = ((new Date).getTime() - begin.getTime()) / 1000
                    await session.send(e.sender.nickname + ' 消耗 ' + cost + ' 点(' + costPrice.toFixed(4) + '元), 剩余 ' + user.price.toFixed(4) + ' 元, 耗时 ' + costTime.toFixed(1) + ' 秒。', true)
                    client.deleteMsg(sid.message_id)
                    fsp.unlink(filename)
                    const anlas = await getAnlas()
                    this.data.config.updateOne({ type: 'main' }, { $set: { anlas } })
                } else {
                    let reason = ''
                    if (res[0].status == 'rejected' && res[1].status == 'rejected') reason = 'getPrice: ' + res[0].reason.toString() + '\n' + 'getImage: ' + res[1].reason.toString() 
                    else if (res[0].status == 'rejected') reason = 'getPrice: ' + res[0].reason.toString()
                    else if (res[1].status == 'rejected') reason = 'getImage: ' + res[1].reason.toString()
                    session.send('错误:\n' + reason)
                }
            }
        }),
        // add
        new Command({
            name: 'add',
            description: '添加用户余额',
            args: [
                {
                    name: '用户',
                    argType: 'positional',
                    required: true,
                    dataType: 'at',
                    description: '用户'
                },
                {
                    name: '金额',
                    argType: 'positional',
                    required: true,
                    dataType: 'number',
                    description: '金额'
                }
            ],
            userWhitelist: config.superusers,
            async job(e, session, client) {
                let res = await this.data.users.findOne({ qid: e.args['用户'] })
                if (!res) {
                    res = {
                        qid: e.args['用户'],
                        price: 0
                    }
                }
                res.price += e.args['金额']
                delete res._id
                await this.data.users.updateOne({ qid: e.args['用户'] }, { $set: res }, { upsert: true })
                const username = e.args['用户'] && (await client.getStrangerInfo(e.args['用户'] as number)).nickname || '<公用账户>'
                session.send('用户 ' + username + ' 余额增加 ' + e.args['金额'] + ' 元， 当前余额 ' + res.price.toFixed(2) + ' 元。')
                const total = (await this.data.users.aggregate([{$group: { _id: null, price : { $sum: "$price" }}}]).toArray())[0]
                this.data.config.updateOne({ type: 'main' }, { $set: { price: total.price }})
            }
        }),
        // info
        new Command({
            name: 'info',
            description: '查看用户余额',
            args: [
                {
                    name: '用户',
                    argType: 'positional',
                    required: false,
                    dataType: 'at',
                    description: '用户'
                },
                {
                    name: '公用账户',
                    argType: 'keyword',
                    alias: ['-g', '--global'],
                    required: false,
                    dataType: 'boolean',
                    description: '公用账户'
                }
            ],
            async job(e, session, client) {
                const userid: number = e.args['公用账户'] ? 0 : (e.args['用户'] !== undefined ? e.args['用户'] : e.sender.user_id) as number
                let res = await this.data.users.findOne({ qid: userid })
                if (!res) {
                    res = {
                        qid: userid,
                        price: 0
                    }
                }
                const username =userid && (await client.getStrangerInfo(userid)).nickname || '<公用账户>'
                session.send('用户 ' + username + ' 余额 ' + res.price.toFixed(2) + ' 元。')
            }
        })
    ]
})