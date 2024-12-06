import {
    gfx,
    model,
    image,
    run,
    App
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({
        depth: true,
        msaa: true
    })
    let frog = await model(g, 'frog/scene.gltf')
    let color = g.texture(await image('frog/textures/BakedCycles_diffuse.png'), {
        flip: false
    })
    return async (input) => {
        buf.clear(true, true)
        frog.items.forEach((item, i) => {
            if(i !== 1) return
            return buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time],
                    ['color', color]
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.01, 5000.);
                        mat4 view = lookat(
                            vec3(0., 0., 0.02),
                            vec3(0., 0., 0.)
                        ) * translate(0., 3.5, 12.);
                        mat4 model =
                            rotatey(-v.time * 1.);
                        return mat4[3](proj, inverse(view), model);
                    }
                    vec4 pixel(px p) {
                        // return vec4(p.uv.x, p.uv.y, 1, 1);
                        return texture(p.color, p.uv);
                    }
                `
            })
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
