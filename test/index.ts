import * as path from 'path';
import { Litbot } from '../src/index';
import config from './config'
const bot = new Litbot(config)
// bot.data.a = 1
// bot.middleware(path.join(__dirname, './middlewares/bracket.ts'))
bot.middleware(path.join(__dirname, './middlewares/gpt3.ts'))
bot.commands([
    // path.join(__dirname, './commands/ping.ts'),
    // path.join(__dirname, './commands/hello.ts'),
    // path.join(__dirname, './commands/data.ts'),
    // path.join(__dirname, './commands/global.ts'),
    // path.join(__dirname, './commands/rut.ts'),
    // path.join(__dirname, './commands/gp.ts'),
    // path.join(__dirname, './commands/ai/ai.ts'),
    // path.join(__dirname, './commands/dv.ts'),
    // path.join(__dirname, './commands/ncov.ts'),
    path.join(__dirname, './commands/emojimix.ts'),
    path.join(__dirname, './commands/short.ts'),
])
// bot.crontab(path.join(__dirname, './crontab/timer.ts'))
