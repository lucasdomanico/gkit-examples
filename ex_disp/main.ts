import {
    run,
    gfx,
    image,
    App,
    record
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer()
    let noisebuf = g.buffer()
    noisebuf.draw({
        uniforms: [
            ['n', 10]
        ],
        shader: `
            vec4 pixel(px p) {
                float f = vnoise(p.uv * p.n, 5);
                return vec4(f, f, f, 1);
            }
        `
    })
    let war = g.texture(await image('wario.png'))
    return async (input) => {
        buf.draw({
            clear: true,
            uniforms: [
                ['tex', noisebuf.color(0)],
                ['war', war],
                ['time', input.time]
            ],
            shader: `
                vec4 pixel(px p) {
                    float d = texture(p.tex, mirror(p.uv + p.time * 0.1)).x;
                    return texture(p.war, p.uv + d * 0.04);
                }
            `
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
