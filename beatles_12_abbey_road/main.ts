import {
    gfx,
    run,
    App,
    image,
    record,
    hmap,
    blit
} from '../../@gkit/gkit.js'

export let vertex = `
    mat4[3] vertex(vx v) {
        mat4 camera = lookat(
            vec3(0., 0., 20.),
            vec3(0., 0., 0.)
        );
        mat4 model = rotatey((wave(v.time * 0.5 * 0.5) - 0.5) * 0.2) *
            scale(20.,20.,10.);
        model *= rotatex((wave(v.time * 0.25 * 0.5) * 0.1) * 0.4);
        model *= translate(0., 0.05, 0.);
        return mat4[3](
            perspective(45., v.aspect, 1., 100.),
            inverse(camera),
            model
        );
    }
`

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({ depth: true })
    let bg = g.texture(await image('bg.png'))
    let mesh = g.mesh(hmap(await image('hmap.png')))
    let tex = g.texture(await image('abbey.png'))
    let beatles = g.texture(await image('beatles.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let droidez = g.texture(await image('droidez.png'))
    return async (input) => {
        buf.clear()
        blit(buf, bg)
        buf.draw({
            depth: true,
            mesh: mesh,
            uniforms: [
                ['tex', tex],
                ['time', input.time]
            ],
            shader: vertex + `
                vec4 pixel(px p) {
                    return texture(p.tex, p.uv);
                }
            `
        })
        buf.draw({
            uniforms: [
                ['tex', beatles],
                ['time', input.time]    
            ],
            shader: vertex + `
                vec4 effect(sampler2D tex, vec2 uv, float size) {
                    float dx = size / 1000.;
                    float dy = size / 1000.;
                    float x = dx * (floor(uv.x / dx) + 0.5);
                    float y = dy * (floor(uv.y / dy) + 0.5);
                    return texture(tex, vec2(x, y));
                }
                float ease(float f) {
                    return f * f * f * f;
                }
                vec4 pixel(px p) {
                    // p.uv.x += wave(mod(-p.time * 0.2, 0.5) * 0.2) * 4.9;
                    // p.uv.x += 1.25;
                    // p.uv.x -= p.time * 0.15;
                    return effect(p.tex, p.uv, ease(wave(p.time * 0.2)) * 100.);
                    return texture(p.tex, p.uv);
                }
            `
        })
        blit(buf, beatmemo)
        blit(buf, droidez)
        g.flush(buf)
    }
}

export let main = () => run(app)

