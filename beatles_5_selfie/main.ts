const $pass:any = () => {}

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
    let buf = g.buffer($pass)
    let warp = g.buffer($pass)
    let center = g.texture(await image('center.png'), $pass)
    let beatmemo = g.texture(await image('beatmemo.png'), $pass)
    let droidez = g.texture(await image('droidez.png'), $pass)
    return async (input) => {
        buf.clear()
        warp.draw({
            clear: true,
            uniforms: [
                ['time', input.time]
            ],
            shader: `
                vec4 pixel(px p) {
                    vec2 uv = p.uv;
                    float a = vnoise(uv + vnoise(uv, 5) * (p.time * 10. + 100.), 5);
                    vec4 c = mix(vec4(1, 1, 0, 1), vec4(0, 0, 0, 1), a);
                    return c;
                }
            `
        })
        buf.draw({
            uniforms: [
                ['time', input.time],
                ['warp', warp.color(0)]
            ],
            shader: `
                mat4 view(float time) {
                    float x = -20.;
                    float y = -25.;
                    float z = 850.;
                    float speed = 0.4;
                    float mx = 1.;
                    float my = 1.25;
                    return inverse(lookat(vec3(
                        x + cos(time * 0.668 * speed) * 0.104 * z * mx,
                        y + sin(time * 0.860 * speed) * 0.080 * z * my,
                        z
                    ), vec3(0)));
                }
                mat4 camera(float time, float aspect) {
                    return perspective(68.621, aspect, 0.1, 10000.) * view(time);
                }
                mat4 vertex(vx v) {
                    return camera(v.time * 4., v.aspect) *
                        translate(0., 0., -1600.) *
                        scale(5032., 5032., 1.);
                }
                vec4 pixel(px p) {
                    return hue(texture(p.warp, p.uv), 0.6 + wave(p.time * 0.5) * 0.1);
                }
            `
        })
        buf.draw({
            uniforms: [
                ['center', center],
                ['warp', warp.color(0)],
                ['time', input.time]
            ],
            shader: `
                mat4 vertex(vx v) {
                    mat4 proj = perspective(80., v.aspect, 0.1, 1000.);
                    float y = wave(v.time * 0.25);
                    float z = wave(v.time * 0.25);
                    mat4 view = lookat(
                        vec3(0., 0., 0.3),
                        vec3(0, 0, 0)
                    );
                    mat4 model = translate(
                        0.,
                        rescale(y, 0., 1., 0., -0.),
                        rescale(z, 0., 1., -0.1, -0.3)
                    );
                    return proj * inverse(view) * model;
                }
                vec4 pixel(px p) {
                    vec4 w = texture(p.warp, p.uv);
                    vec4 c = texture(p.center, p.uv);
                    w *= 0.7;
                    return hue(multiply(w, c), 0.3) * c.a;
                }
            `
        })
        blit(buf, beatmemo)
        blit(buf, droidez)
        g.flush(buf)
    }
}

export let main = () => run(app)
