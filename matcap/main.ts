import {
    gfx,
    run,
    App,
    image,
    sphere
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({ depth:true })
    let sphere_mesh = g.mesh(sphere())
    let tex = g.texture(await image('submarine.png'))
    return async (input) => {
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(1);
                }
            `
        })
        buf.draw({
            depth: true,
            mesh: sphere_mesh,
            uniforms: [
                ['tex', tex]
            ],
            shader: `
                mat4 vertex(vx v) {
                    mat4 proj = perspective(1., v.aspect, 0.1, 1000.);
                    mat4 view = translate(0., 0., 115.);
                    mat4 model = translate(0., 0., 0.);
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

