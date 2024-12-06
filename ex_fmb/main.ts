const $pass:any = () => {}

import {
    run,
    gfx,
    App
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer($pass)
    return async (input) => {
        buf.draw({
            clear: true,
            uniforms: [
                ['time', input.time]
            ],
            shader: `
                vec4 pixel(px p) {
                    float d = vnoise(p.uv * 10. + p.time, 5);
                    return vec4(d, d, d, 1);
                }
            `
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
