import { MessageElem, segment, ImageElem, MessageRet } from "icqq"
import { Command } from '../../src/index'
import { exec } from 'child_process'
import axios from 'axios'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'

async function downloadFile(url: string, file: string) {
    const writer = fs.createWriteStream(file);
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", e => {
            resolve(e);
        });
        writer.on("error", e => {
            console.log(e)
            reject()
        });
    });
}

export default new Command({
    name: 'gp',
    description: '给图片打 GeekPara 水印',
    job: async (e, s, c) => {
        await s.send('图片:')
        const img = await s.recv()
        let img_r: ImageElem | null = null
        for (const i of img.message) {
            if (i.type == 'image') {
                img_r = i
                break
            }
        }
        if (img_r && img_r.url !== undefined && img_r.file !== undefined) {
            const tip = (await s.send('请稍等')) as MessageRet
            const filepath = img_r.file as string
            await (await downloadFile(img_r.url, filepath))
            exec(`python3 ${path.join(__dirname, '../tools/logo.py')} ${path.join(__dirname, '../static/logo.png')} ${filepath}`, async (err, stdout, stderr) => {
                c.deleteMsg(tip.message_id)
                if (err) {
                    await s.send(err.toString())
                    return
                }
                await s.send(segment.image('logo_' + filepath))
                fsp.unlink(filepath)
                fsp.unlink('logo_' + filepath)
            })
            
        } else {
            await s.send('图片获取失败！')
        }
    },
    groupWhitelist: {
        833938858: true,
        715207945: true
    }
})