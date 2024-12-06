import {
    gfx,
    model,
    App,
    run,
    record
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({ depth:true, msaa:true })
    let soldier = await model(g, 'soldier.glb')
    let mode = 0
    return async (input) => {
        if(input.clicks.length) mode += 1
        let clipid = (() => {
            if((mode % 4) === 0) return 'Idle'
            if((mode % 4) === 1) return 'Walk'
            if((mode % 4) === 2) return 'Run'
            return 'TPose'
        })()
        buf.clear()
        let clip = soldier.clips.findIndex((c) => c.name === clipid)
        soldier.items.forEach((item) => {
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
                        mat4 proj = perspective(80., v.aspect, 0.01, 5000.);
                        mat4 view = lookat(
                            vec3(0., 0., 0.02),
                            vec3(0., 0., 0.)
                        ) * translate(0., 0.01, 0.);
                        mat4 model =
                            rotatey(-v.time * 1. * pi) *
                            rotatex(pi / 2.) * 
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
