import { Crontab } from '../../src/index'

export default new Crontab({
    name: 'timer',
    cronstr: '*/2 * * * * *',
    job: async (client, data) => {
        console.log('hello')
    }
})