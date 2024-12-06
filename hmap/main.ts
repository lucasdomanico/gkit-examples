import {
    gfx,
    run,
    App,
    image,
    hmap,
    record
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({
        depth: true
    })
    let mesh = g.mesh(hmap(await image('hmap.png')))
    let tex = g.texture(await image('img.jpg'))
    return async (input) => {
        buf.draw({
            clear: true,
            depth: true,
            mesh: mesh,
            uniforms: [
                ['tex', tex],
                ['time', input.time]
            ],
            shader: `
                mat4[3] vertex(vx v) {
                    mat4 camera = lookat(        
                        vec3(0., 0., 30.),
                        vec3(0., 0., 0.)
                    );
                    mat4 model = rotatey((wave(v.time * 0.25) - 0.5) * 1.) *
                        scale(20.,20.,20.);
                    model *= rotatex(sin(v.time * 0.2) * 0.04);
                    return mat4[3](
                        perspective(45., v.aspect, 1., 100.),
                        inverse(camera),
                        model
                    );
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
