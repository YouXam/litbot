import axios from 'axios'
import config_ from './config'
import { headers, login, download, resizeInput } from './utils'
import getImageSize from 'image-size'

let token: string = ''
const modelMap = {
    safe: 'safe-diffusion',
    full: 'nai-diffusion',
    furry: 'nai-diffusion-furry',
}

const orientMap: { [key: string]: { height: number, width: number } } = {
    landscape: { height: 512, width: 768 },
    portrait: { height: 768, width: 512 },
    square: { height: 640, width: 640 },
}

interface Parameters {
    /** 图片 url */
    imgUrl?: string
    /** 采样器 */
    sampler?: string
    /** 图片方向 */
    orient?: string
    /** 种子 */
    seed?: number
    /** 图片数量 */
    n_samples?: number
    /** 过滤的内容 */
    uc?: string
    ucPreset?: number
    /** 文本相关性 */
    scale?: number
    /** 迭代次数 */
    steps?: number
    /** 图片增强 */
    enhance?: boolean
    /** 图片改变强度 */
    strength?: number
    /** 图片噪音 */
    noise?: number,
    height?: number,
    width?: number
}

export type Config = Parameters & {
    /** 是否有 nsfw 内容 */
    nsfw?: boolean
    /** 输入文本 */
    input: string
    /** 模型 */
    model: string
}

interface Size {
    width: number
    height: number
    orient: string
}

async function getParameters(config: Config) {
    const orient = orientMap[config.orient || 'portrait'] || { height: 768, width: 512 }
    const parameters: Parameters= {
        seed: config.seed || Math.round(new Date().getTime() / 1000),
        n_samples: 1,
        sampler: config.sampler || 'k_euler_ancestral',
        uc: (config.nsfw ? 'nsfw, ' : '') + 'lowres, text, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
        ucPreset: 0,
        height: orient.height,
        width: orient.width,
        scale: config.scale || 12,
        steps: config.steps || 33,
        noise: config.noise || 0.2,
        strength: config.strength || 0.7,
    }
    if (config.imgUrl) {
        const image = Buffer.from(await download(config.imgUrl))
        const size = getImageSize(image) as Size
        Object.assign(parameters, {
            image: image.toString('base64'),
            scale: config.scale || 11,
            steps: config.steps || 50,
        })
        if (config.enhance) {
            if (size.width + size.height !== 1280) {
                throw new Error('invalid size')
            }
            Object.assign(parameters, {
                height: size.height * 1.5,
                width: size.width  * 1.5,
                noise: config.noise || 0,
                strength: config.strength || 0.2,
            })
        } else {
            const orient = resizeInput(size)
            Object.assign(parameters, {
                height: orient.height,
                width: orient.width,
                noise: config.noise || 0.2,
                strength: config.strength || 0.7,
            })
        }
    }
    return parameters
}

export async function getPrice(config: Config) {
    const parameters = await getParameters(config)
    if (!token.length) token = await login(config_.email, config_.password)
    config.input = config.input.toLowerCase().replace(/[,，]/g, ', ').replace(/\s+/g, ' ')
    if (/[^\s\w"'“”‘’.,:|()\[\]{}-]/.test(config.input)) {
        throw new Error('invalid input')
    }
    const res = await axios('https://api.novelai.net/ai/generate-image/request-price', {
        method: 'POST',
        timeout: config_.requestTimeout,
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
            'Content-Type': 'application/json; charset=UTF-8'
        },
        data: { "tier": "TABLET", "request": { "input": [config.input], "model": config.model, "parameters": parameters } }
    });
    return res.data
}

export async function getImage(config: Config) {
    const parameters = await getParameters(config)
    if (!token.length) token = await login(config_.email, config_.password)
    config.input = config.input.toLowerCase().replace(/[,，]/g, ', ').replace(/\s+/g, ' ')
    if (/[^\s\w"'“”‘’.,:|()\[\]{}-]/.test(config.input)) {
        throw new Error('invalid input')
    }
    const res = await axios(config_.endpoint + '/ai/generate-image', {
        method: 'POST',
        timeout: config_.requestTimeout,
        headers: {
            ...headers,
            path: '/ai/generate-image',
            authorization: 'Bearer ' + token,
        },
        data: { model: config.model, input: config.input, parameters },
    })
    const art = res.data.substr(27, res.data.length)
    return art
}


export async function getAnlas() {
    if (!token.length) token = await login(config_.email, config_.password)
    const res = await axios(config_.endpoint + '/user/subscription', {
        method: 'GET',
        timeout: config_.requestTimeout,
        headers: {
            authorization: 'Bearer ' + token,
        },
    })
    return res.data.trainingStepsLeft.fixedTrainingStepsLeft + res.data.trainingStepsLeft.purchasedTrainingSteps
}
