import { Crontab } from '../../src/index'

export default new Crontab({
    name: 'timer',
    cronstr: '*/3 * * * * *',
    job: async (client, data) => {
        // console.log('hello')
    }
})