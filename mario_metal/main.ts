import {
    gfx,
    run,
    App,
    model,
    image
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({ depth:true })
    let metal = g.texture(await image('metal.png'))
    let mario = await model(g, 'mario.glb')
    return async (input) => {
        buf.clear()
        mario.items.forEach((item) => {
            buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time * 1],
                    ['metal', metal]
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.1, 5000.);
                        mat4 view = lookat(
                            vec3(0., 0., 5.01),
                            vec3(0., 0., 0.)
                        ) * translate(0., 1.2, 0.);
                        mat4 model = rotatey(v.time);
                        return mat4[3](proj, inverse(view), model);
                    }
                    vec4 pixel(px p) {
                        return texture(p.metal, matcap(p.eye, p.normal));
                    }
                `
            })
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
