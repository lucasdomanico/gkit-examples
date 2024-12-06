import {
    gfx,
    model,
    run,
    App
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({ depth:true, msaa:true })
    let bot = await model(g, 'bot.glb')
    return async (input) => {
        buf.clear()
        bot.items.forEach((item) => {
            let clip = item.clips[0]
            if(!clip) return
            return buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time],
                    ['clip', clip],
                    ['color', item.color]
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.01, 5000.);
                        mat4 view = lookat(
                            vec3(0., 0., 0.02),
                            vec3(0., 0., 0.)
                        ) * translate(0., 0.01, 0.);
                        mat4 model =
                            rotatex(pi / -2.) *
                            rotatez(-v.time * 1.) *
                            clip(v.clip, v.joints, v.weights, v.time);
                        return mat4[3](proj, inverse(view), model);
                    }
                    vec4 pixel(px p) {
                        // return texture(p.color, p.uv);
                        return vec4(p.uv.x, p.uv.y, 1, 1);
                    }
                `
            })
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
