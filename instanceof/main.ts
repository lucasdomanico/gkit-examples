import {
    Point
} from './lib.js'

import {
    create
} from './proxy.js'

export type main = () => void
export const main:main = () => {
    let p = create()
    return console.log(p instanceof Point)
}
