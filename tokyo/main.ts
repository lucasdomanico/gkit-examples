import {
    gfx,
    model,
    run,
    App
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({ depth:true, msaa:true })
    let tokyo = await model(g, 'tokyo.glb')
    return async (input) => {
        buf.clear()
        let clip = tokyo.clips.findIndex((c) => c.name === 'Take 001')
        tokyo.items.forEach((item) => {
            buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time],
                    ['clip', item.clips[clip]],
                    ['color', item.color]    
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 100., 5000.);
                        mat4 view = lookat(
                            vec3(
                                sin(v.time * 0.1) * 600.,
                                0.,
                                cos(v.time * 0.1) * 600.
                            ),
                            vec3(0., 0., 0.)
                        ) * translate(0., -40., 0.);
                        mat4 model = clip(v.clip, v.joints, v.weights, v.time);
                        return mat4[3](proj, inverse(view), model);
                    }
                    vec4 pixel(px p) {
                        return texture(p.color, p.uv);
                    }
                `
            })
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
