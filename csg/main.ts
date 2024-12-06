import * as three from './three-v166/three.module.js'
import * as csg from './cgs/CSG.js'
import * as roundedbox from './RoundedBoxGeometry.js'

import {
    gfx,
    App,
    play,
    geometry,
    image
} from '../../gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({ depth:true })
    let tex = g.texture(await image('metal.png'))
    let box = csg.CSG.fromGeometry(new roundedbox.RoundedBoxGeometry(2, 2, 2, 2, 0.4))
    return async (input) => {
        // let box = new three.BoxGeometry(2, 2, 2)
        // let box = new roundedbox.RoundedBoxGeometry(2, 2, 2, 2, 0.4)
        let sphere = new three.SphereGeometry(1.2 + Math.sin(input.time), 8, 8)    
        let geo = box.subtract(csg.CSG.fromGeometry(sphere)).toGeometry(new three.Matrix4())
        let mesh = g.mesh(geometry(geo))    
        buf.clear()
        buf.draw({
            depth: true,
            mesh: mesh,
            uniforms: [
                ['tex', tex],
                ['time', input.time]
            ],
            shader: `
                mat4[3] vertex(vx v) {
                    mat4 proj = perspective(80., v.aspect, 0.1, 1000.);
                    mat4 view = translate(0., 0., 5.);
                    mat4 model = rotatex(v.time) * rotatey(v.time * 0.2);
                    return mat4[3](proj, inverse(view), model);
                }
                vec4 pixel(px p) {
                    return texture(p.tex, matcap(p.eye, p.normal));

                    vec3 n = p.normal;
                    return vec4(n.x, n.y, n.z, 1);
                }
            `
        })
        mesh.free()
        g.flush(buf)
    }
}

export let main = () => play(app)
