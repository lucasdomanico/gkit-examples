import {
    gfx,
    run,
    App,
    image,
    curve,
    record,
    hmap,
    blit
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({
        depth: true
    })
    let warp = g.buffer()
    let mesh = g.mesh(hmap(await image('hmap.png')))
    let hmapt = g.texture(await image('hmap.png'))
    let tex = g.texture(await image('lennon.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let droidez = g.texture(await image('droidez.png'))
    return async (input) => {
        buf.clear()
        warp.draw({
            uniforms: [
                ['time', input.time]
            ],
            shader: `
                float pattern(vec2 uv, float time) {
                    uv *= 10.1;
                    float x = vnoise(uv + 10., 5) * 10.;
                    float y = vnoise(uv + 10., 5);
                    x = cos(x + time) * vnoise(vec2(x), 5);
                    y = sin(y + time) * vnoise(vec2(y), 5);
                    return vnoise(vec2(x, y), 5);
                }
                vec4 pixel(px p) {
                    float a = pattern(p.uv, p.time);
                    vec4 c = mix(vec4(1, 1, 0, 1), vec4(1, 0, 0, 1), a);
                    return c;
                }
            `
        })
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(0, 0, 0, 1);
                }
            `
        })
        buf.draw({
            depth: true,
            mesh: mesh,
            uniforms: [
                ['tex', tex],
                ['time', input.time],
                ['hmap', hmapt],
                ['warp', warp.color(0)]
            ],
            shader: `
                mat4[3] vertex(vx v) {
                    mat4 camera = lookat(
                        vec3(0., 0., 20.),
                        vec3(0., 0., 0.)
                    );
                    mat4 model = rotatey((wave(v.time * 0.25) - 0.5) * 1.) *
                        scale(20.,20.,40.);
                    model *= rotatex((wave(v.time * 0.25) * 0.1) * 1.);
                    return mat4[3](
                        perspective(45., v.aspect, 1., 100.),
                        inverse(camera),
                        model
                    );
                }
                vec4 pixel(px p) {
                    float h = 1. - texture(p.hmap, p.uv).x;
                    vec4 c = texture(p.tex, p.uv);
                    return multiply(texture(p.warp, p.uv), c) * h;
                }
            `
        })
        blit(buf, beatmemo)
        blit(buf, droidez)
        g.flush(buf)
    }
}

export let main = () => run(app)
