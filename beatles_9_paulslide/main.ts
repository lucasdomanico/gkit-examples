const range = (n:number):number[] => {
    let v = Array(n) as number[]
    for(let i = 0; i < n; i++) {
        v[i] = i
    }
    return v
}

import {
    gfx,
    run,
    App,
    image,
    record,
    Buffer,
    Texture,
    blit,
} from '../../@gkit/gkit.js'


export class Shadow { constructor(
    public x:number,
    public v:number
    ) {}
    static struct = (o:{ x:number, v:number }) => {
        return new Shadow(o.x, o.v)
    }
}

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer()
    let spritebuf = g.buffer()
    let front = g.texture(await image('front.png'))
    let shadow = g.texture(await image('shadow.png'))
    let ball = g.texture(await image('ball.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let lucasd = g.texture(await image('lucasdomanico.png'))
    let shadows = ([] as Array<Shadow>)
    let spawn = 0
    return async (input) => {
        spawn += input.delta
        if(spawn > 0.1) {
            spawn = 0
            shadows.push(new Shadow(0, 0))
        }
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(0, 0, 0, 0.2);
                }
            `
        })
        shadows = shadows.filter((s) => {
            s.v += 0.1
            s.x += s.v
            spritebuf.clear()
            blit(spritebuf, shadow, s.x, 0)
            blit(buf, spritebuf.color(0))
            return s.x < 1000
        })
        blit(buf, front)
        range(3).forEach((n) => {
            blit(buf, ball, 50, 50 + n * 100, {
                rz: input.time * 4,
                width: 100,
                height: 100
            })
        })
        blit(buf, beatmemo)
        blit(buf, lucasd)
        g.flush(buf)
    }
}

export let main = () => run(app)

