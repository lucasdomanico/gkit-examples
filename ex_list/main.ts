const range = (n:number):number[] => {
    let v = Array(n) as number[]
    for(let i = 0; i < n; i++) {
        v[i] = i
    }
    return v
}

import {
    clone,
} from '../../@gkit/gkit.js'

export class Empty { constructor() {} }

export type main = () => void
export const main:main = () => {
    let t1 = Date.now()
    for(let x = 0; x < 100000; x++) {
        Array.from(new Array(1000).keys())
    }
    console.log(Date.now() - t1)
    let t2 = Date.now()
    for(let x = 0; x < 100000; x++) {
        range(1000)
    }
    console.log(Date.now() - t2)
    let t3 = Date.now()
    for(let x = 0; x < 100000; x++) {
        let v = ([] as Array<number>)
        for(let x = 0; x < 1000; x++) {
            v.push(x)
        }
    }
    console.log(Date.now() - t3)
    console.log('he'.concat('llo'))
    let e = new Empty()
    let s = structuredClone(e)
    let c = clone(e)
    console.log(s instanceof Empty)
    return console.log(c instanceof Empty)
}

