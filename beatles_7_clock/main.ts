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
    curve,
    blit,
    record,
    hmap,
    Buffer,
    Texture,
} from '../../@gkit/gkit.js'


export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer()
    let flow = g.buffer()
    let copy = g.buffer()
    let warp = g.buffer()
    let bg = g.texture(await image('bg.png'))
    let line = g.texture(await image('line.png'))
    let droidez = g.texture(await image('droidez.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    return async (input) => {
        buf.clear()
        range(10).forEach(() => {
            let n = 5
            range(n).forEach((i) => {
                blit(flow, line, 0, 0, {
                    rz: input.time + i * (Math.PI * 2 / n)
                })
            })
        })
        copy.draw({
            clear: true,
            uniforms: [
                ['tex', flow.color(0)]
            ],
            shader: `
                vec4 pixel(px p) {
                    return texture(p.tex, p.uv) * 0.95;
                }
            `
        })
        flow.clear()
        blit(flow, copy.color())
        warp.draw({
            clear: true,
            uniforms: [
                ['time', input.time]
            ],
            shader: `
                float pattern(vec2 uv, float time) {
                    float f = vnoise(uv * 10. + time, 5);
                    f = vnoise(uv * f + time, 5);
                    return f;
                }
                vec4 pixel(px p) {
                    float f = pattern(p.uv, p.time);
                    return vec4(f);
                }
            `
        })
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(1);
                }
            `
        })
        buf.draw({
            uniforms: [
                ['flow', flow.color(0)],
                ['warp', warp.color(0)],
                ['bg', bg]
            ],
            shader: `
                vec4 pixel(px p) {
                    vec4 c = texture(p.bg, p.uv);
                    vec4 f = texture(p.flow, p.uv);
                    vec4 w = texture(p.warp, p.uv);
                    return hue(mix(vec4(0), c, f * 2.), w.x);
                }
            `
        })
        blit(buf, beatmemo)
        blit(buf, droidez)
        g.flush(buf)
    }
}

export let main = () => run(app)

