import { MessageElem, segment, ImageElem, MessageRet } from "oicq"
import { Command } from '../../src/index'
import axios from 'axios'
import * as images from 'images'
import * as fs from 'fs'
import * as fsp from 'fs/promises'

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
            const image = images(filepath)
            const logo = images('test/static/logo.png')
            const imageSize = image.size()
            const logoSize = logo.size()
            logo.resize(imageSize.width / 5, imageSize.width / 5 / logoSize.width * logoSize.height)
            image.draw(logo, imageSize.width - logo.size().width - 10, 10).save('logoed_' + filepath)
            await s.send(segment.image('logoed_' + filepath))
            c.deleteMsg(tip.message_id)
            fsp.unlink(filepath)
            fsp.unlink('logoed_' + filepath)
        } else {
            await s.send('图片获取失败！')
        }
    },
    groupWhitelist: {
        833938858: true,
        715207945: true
    }
})