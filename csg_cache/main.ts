import {
    gfx,
    App,
    play,
    image,
    rescale,
    animation,
    csg,
    sphere,
    roundedbox
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({ depth:true })
    let tex = g.texture(await image('metal.png'))
    let a = animation(5, 60, (time, { secs }) => {
        let box = csg(roundedbox(2, 2, 2, 2, 0.4))
        let t = 0
        if(time < secs / 2) t = rescale(time, 0, secs / 2, 1, 1.5)
        else                t = rescale(time, secs / 2, secs, 1.5, 1)
        let csgsphere = csg(sphere(t, 12, 12))    
        let meshdata = box.subtract(csgsphere).meshdata()
        return g.mesh(meshdata)
    })
    return async (input) => {
        buf.clear()
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(1);
                }
            `
        })
        buf.draw({
            depth: true,
            mesh: a.index(input.time),
            uniforms: [
                ['tex', tex],
                ['time', input.time]
            ],
            shader: `
                mat4[3] vertex(vx v) {
                    mat4 proj = perspective(80., v.aspect, 0.1, 1000.);
                    mat4 view = translate(0., 0., 2.);
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
        g.flush(buf)
    }
}

export let main = () => play(app)
