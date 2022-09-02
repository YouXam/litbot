import * as path from 'path';
import { Litbot } from '../src/index';
import config from './config'
const bot = new Litbot(config)
bot.data.a = 1
bot.commands([
    path.join(__dirname, './commands/ping.ts'),
    path.join(__dirname, './commands/hello.ts'),
    path.join(__dirname, './commands/data.ts'),
    path.join(__dirname, './commands/global.ts')
])
bot.crontab(path.join(__dirname, './crontab/timer.ts'))
