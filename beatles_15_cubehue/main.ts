import {
    gfx,
    App,
    play,
    image,
    rescale,
    animation,
    csg,
    sphere,
    roundedbox,
    sprite,
    record
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer()
    let bufcube = g.buffer({ depth:true })
    let tex = g.texture(await image('metal.png'))
    let beatles = g.texture(await image('beatles.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let lucasd = g.texture(await image('droidez.png'))
    let a = animation(2, 60, (time, { secs }) => {
        let box = csg(roundedbox(2, 2, 2, 2, 0.4))
        let t = 0
        if(time < secs / 2) t = rescale(time, 0, secs / 2, 1, 1.5)
        else                t = rescale(time, secs / 2, secs, 1.5, 1)
        let csgsphere = csg(sphere(t, 16, 16))    
        let meshdata = box.subtract(csgsphere).meshdata()
        return g.mesh(meshdata)
    })
    return async (input) => {
        buf.clear()
        buf.draw({
            uniforms: [
                ['beat', beatles]
            ],
            shader: `
                vec4 pixel(px p) {
                    //return texture(p.beat, p.uv);
                    return vec4(1);
                }
            `
        })
        bufcube.clear()
        bufcube.draw({
            depth: true,
            mesh: a.index(input.time),
            uniforms: [
                ['tex', tex],
                ['time', input.time]
            ],
            shader: `
                mat4[3] vertex(vx v) {
                    mat4 proj = perspective(80., v.aspect, 0.1, 1000.);
                    mat4 view = translate(0., 0., 1.7);
                    mat4 model = rotatex(v.time) * rotatey(v.time * 0.2);
                    return mat4[3](proj, inverse(view), model);
                }
                vec4 pixel(px p) {
                    return texture(p.tex, matcap(p.eye, p.normal));
                }
            `
        })
        buf.draw({
            uniforms: [
                ['cube', bufcube.color()],
                ['beat', beatles],
                ['time', input.time]
            ],
            shader: `
                vec4 pixel(px p) {
                    vec4 c = texture(p.cube, p.uv);
                    vec4 b = hue(texture(p.beat, p.uv), rescale(wave(p.time * 0.2), 0., 1., 0., 0.2));
                    //return hue(c, b.x + p.time * 0.1);
                    return overlay(b, c);
                }
            `
        })
        sprite(buf, beatmemo)
        sprite(buf, lucasd)
        g.flush(buf)
    }
}

export let main = () => play(app)
