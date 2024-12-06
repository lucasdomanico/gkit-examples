import {
    gfx,
    run,
    App,
    image,
    sphere as new_sphere,
    record
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer()
    let tex = g.texture(await image('wario.png'))
    let sphere = g.mesh(new_sphere())
    return async (input) => {
        buf.draw({
            clear: true,
            mesh: sphere,
            uniforms: [
                ['tex', tex],
                ['time', input.time]
            ],
            shader: `
                mat4 vertex(vx v) {
                    mat4 proj = perspective(80., v.aspect, 0.01, 1000.);
                    mat4 view = translate(0., 0., 4.);
                    mat4 model = rotatey(v.time * pi / 2.);
                    return proj * inverse(view) * model;
                }
                vec4 pixel(px p) {
                    return texture(p.tex, p.uv);
                }
            `
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
