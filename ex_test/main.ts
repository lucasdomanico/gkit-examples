import {
    gfx,
    run,
    App,
    image
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer()
    let tex = g.texture(await image('wario.png'))
    buf.draw({
        uniforms: [
            ['tex', tex]
        ],
        shader: `
            vec4 pixel(px p) {
                return texture(p.tex, p.uv);
            }
        `
    })
    let buf2 = g.buffer()
    return async (input) => {
        buf2.draw({
            uniforms: [
                ['tex', buf.color(0)],
                ['time', input.time * 0.1]
            ],
            shader: `
                vec4 pixel(px p) {
                    vec4 c = texture(p.tex, p.uv);
                    vec4 b = vec4(p.uv.x, p.uv.y, 1, 1);
                    return blend(b, hue(c, wave(p.time)));
                }
            `
        })
        g.flush(buf2)
    }
}

export let main = () => run(app)
