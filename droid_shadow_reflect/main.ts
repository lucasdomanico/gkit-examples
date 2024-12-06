import {
    gfx,
    run,
    App,
    droid,
    image,
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({ depth:true })
    let dbuf = g.buffer()
    let d = droid(g)
    // console.log(d)
    let skin = 'dott'
    let dbody = g.texture(await image(skin + '_body.png'))
    let darm = g.texture(await image(skin + '_arms.png'))
    let dfoot = g.texture(await image(skin + '_legs.png'))
    return async (input) => {
        buf.clear()
        let clip = d.clips.findIndex((c) => c.name === 'run')
        d.items.forEach((item) => {
            let tex = (() => {
                if(item.name === 'body') {
                    return dbody
                }
                if(item.name.startsWith('arm')) {
                    return darm
                }
                return dfoot
            })()
            buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time * 1],
                    ['clip', item.clips[clip]],
                    ['tex', tex]
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(75., v.aspect, 0.1, 1000.);
                        mat4 view = translate(0., 0., 5.);
                        mat4 model = rotatey(v.time) *
                            clip(v.clip, v.joints, v.weights, v.time);
                        return mat4[3](proj, inverse(view), model);
                    }
                    float cel(float f) {
                        if(f > 0.66) return 0.66;
                        if(f > 0.33) return 0.33;
                        return 0.;
                    }
                    vec4 pixel(px p) {
                        float d = diffuse(vec3(100, 100, -20), p.pos, p.normal);
                        d = cel(d);
                        // d = d * (1. - fresnel(p.pos, p.normal, p.eye) * 1.5);
                        return mix(texture(p.tex, p.uv), vec4(0, 0, 0, 1), d);
                        return vec4(p.normal.x, p.normal.y, p.normal.z, 1);
                    }
                `
            })
        })
        dbuf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(1, 0, 0, 1);
                }
            `
        })
        dbuf.draw({
            uniforms: [
                ['img', buf.color()],
                ['time', input.time]
            ],
            shader: `
                mat4 vertex(vx v) {
                    mat4 proj = perspective(75., v.aspect, 0.1, 1000.);
                    mat4 view = translate(0., 0., 5.);
                    mat4 model = rotatey(v.time) * scale(6., 1., 6.) * lookatup(
                        vec3(0., -1.5, 0.3),
                        vec3(0., -100., 0.),
                        vec3(0, 0, 1)
                    );
                    return proj * inverse(view) * model;
                }
                vec4 pixel(px p) {
                    float x = 1. - p.uv.x;
                    float y = p.uv.y;
                    return texture(p.img, vec2(x, y));
                }
            `
        })
        dbuf.draw({
            uniforms: [
                ['img', buf.depth()],
                ['tex', buf.color()]
            ],
            shader: `
                vec4 pixel(px p) {
                    float f = sobel(p.img, p.uv, 0.004, 0.004);
                    f = f * 1000.;
                    f = smoothstep(0.7, 1., f);
                    vec4 c = texture(p.tex, p.uv);
                    return blend(c, vec4(0, 0, 0, f));
                }
            `
        })
        g.flush(dbuf)
    }
}

export let main = () => run(app)
