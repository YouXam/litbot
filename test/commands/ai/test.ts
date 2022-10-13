import { getImage, getPrice, Config, getAnlas } from './spider'
import * as fsp from 'fs/promises'
;(async function () {
    getAnlas().then(res => console.log(res))
})()
