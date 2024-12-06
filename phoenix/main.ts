import {
    gfx,
    run,
    App,
    model
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({ depth:true, msaa:true })
    let phoenix = await model(g, 'phoenix.glb')
    return async (input) => {
        buf.clear()
        let clip = phoenix.clips.findIndex((c) => c.name === 'Take 001')
        phoenix.items.forEach((item) => {
            buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time * 1],
                    ['clip', item.clips[clip]],
                    ['color', item.color]
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.1, 5000.);
                        mat4 view = lookat(
                            vec3(0., 0., 0.02),
                            vec3(0., 0., 0.)
                        ) * translate(0., 150., 1000.);
                        mat4 model =
                            rotatey(-v.time * 1.) *
                            clip(v.clip, v.joints, v.weights, v.time);
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
