import {
    Point as ZPoint
} from './lib.js'

export type Lol = ZPoint

export type create = () => ZPoint
export const create:create = () => {
    return new ZPoint(1, 2)
}

export type main = () => void
export const main:main = () => {
    return console.log(new ZPoint(1, 2))
}
