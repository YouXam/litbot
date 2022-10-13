import axios, { AxiosResponse } from 'axios'
import config from './config'
import {
    crypto_generichash, crypto_pwhash,
    crypto_pwhash_ALG_ARGON2ID13, crypto_pwhash_SALTBYTES, ready,
} from 'libsodium-wrappers'

const MAX_OUTPUT_SIZE = 1048576
const ALLOWED_TYPES = ['jpeg', 'png']

export async function download(url: string, headers = {}): Promise<ArrayBuffer> {
    const head = await axios.head(url, { headers })
    if (ALLOWED_TYPES.every(t => (head.headers as any)['content-type'].includes(t))) {
        throw new Error('unsupported file type')
    }
    return (await axios.get(url, { responseType: 'arraybuffer', headers })).data
}

export async function calcAccessKey(email: string, password: string) {
    await ready
    return crypto_pwhash(
        64,
        new Uint8Array(Buffer.from(password)),
        crypto_generichash(
            crypto_pwhash_SALTBYTES,
            password.slice(0, 6) + email + 'novelai_data_access_key',
        ),
        2,
        2e6,
        crypto_pwhash_ALG_ARGON2ID13,
        'base64').slice(0, 64)
}

export async function calcEncryptionKey(email: string, password: string) {
    await ready
    return crypto_pwhash(
        128,
        new Uint8Array(Buffer.from(password)),
        crypto_generichash(
            crypto_pwhash_SALTBYTES,
            password.slice(0, 6) + email + 'novelai_data_encryption_key'),
        2,
        2e6,
        crypto_pwhash_ALG_ARGON2ID13,
        'base64')
}

export const headers = {
    authority: 'api.novelai.net',
    'content-type': 'application/json',
    referer: 'https://novelai.net/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
}



export async function login(email: string, password: string) {
    const res = await axios.post(config.endpoint + '/user/login', {
        key: await calcAccessKey(email, password),
    })
    if (res.data.statusCode == 401) {
        throw new Error(res.data.message)
    }
    return res.data.accessToken
}

export function closestMultiple(num: number, mult: number) {
    const numInt = num
    const floor = Math.floor(numInt / mult) * mult
    const ceil = Math.ceil(numInt / mult) * mult
    const closest = numInt - floor < ceil - numInt ? floor : ceil
    if (Number.isNaN(closest)) return 0
    return closest <= 0 ? mult : closest
}

export interface Size {
    width: number
    height: number
}

export function resizeInput(size: Size): Size {
    // if width and height produce a valid size, use it
    const { width, height } = size
    if (width % 64 === 0 && height % 64 === 0 && width * height <= MAX_OUTPUT_SIZE) {
        return { width, height }
    }

    // otherwise, set lower size as 512 and use aspect ratio to the other dimension
    const aspectRatio = width / height
    if (aspectRatio > 1) {
        const height = 512
        const width = closestMultiple(height * aspectRatio, 64)
        // check that image is not too large
        if (width * height <= MAX_OUTPUT_SIZE) {
            return { width, height }
        }
    } else {
        const width = 512
        const height = closestMultiple(width / aspectRatio, 64)
        // check that image is not too large
        if (width * height <= MAX_OUTPUT_SIZE) {
            return { width, height }
        }
    }

    // if that fails set the higher size as 1024 and use aspect ratio to the other dimension
    if (aspectRatio > 1) {
        const width = 1024
        const height = closestMultiple(width / aspectRatio, 64)
        return { width, height }
    } else {
        const height = 1024
        const width = closestMultiple(height * aspectRatio, 64)
        return { width, height }
    }
}