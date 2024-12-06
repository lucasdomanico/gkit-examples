import {
    gfx,
    run,
    App,
    image,
    record,
    Buffer,
    Texture,
    blit,
} from '../../@gkit/gkit.js'

export type horizon = (buf:Buffer, tex:Texture, time:number, z:number, y:number) => void
export const horizon:horizon = (buf, tex, time, z, y) => {
    return buf.draw({
        uniforms: [
            ['time', time],
            ['tex', tex],
            ['z', z],
            ['y', y]
        ],
        shader: `
            mat4[3] vertex(vx v) {
                mat4 proj = perspective(90., v.aspect, 1., 50.);
                mat4 view = lookat(
                    vec3(0, v.y, 10.),
                    vec3(0., 0., 0.)
                );
                float s = 1000.;
                mat4 model =
                    rotatez(v.z)
                    * translate(0., -5., 10.)
                    * scale(s, s, s)
                    * rotatex(-pi / 2.)
                    ;
                return mat4[3](proj, inverse(view), model);
            }
            vec4 pixel(px p) {
                float w = 20.;
                float h = 20.;
                float x = mod(p.uv.x + p.time * 0.01, 1. / w) * w;
                float y = mod(p.uv.y + p.time * 0.05, 1. / h) * h;
                return texture(p.tex, vec2(x, y));
                return vec4(x, y, 1, 1);
            }
        `
    })
}

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer()
    let buf_horizon = g.buffer()
    let john = g.texture(await image('john.png'))
    let glasses = g.texture(await image('glasses.png'))
    let tex = g.texture(await image('tex.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let lucasd = g.texture(await image('lucasdomanico.png'))
    return async (input) => {
        buf.clear()
        buf_horizon.clear()
        horizon(buf_horizon, tex, input.time, 0, 1.25)
        horizon(buf_horizon, tex, input.time, Math.PI, -1.25)
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(0, 0, 0, 1);
                }
            `
        })
        buf.draw({
            uniforms: [
                ['john', john],
                ['tex', buf_horizon.color(0)],
                ['time', input.time],
                ['glasses', glasses]    
            ],
            shader: `
                vec4 pixel(px p) {
                    vec4 c = texture(p.john, p.uv);
                    float t = wave(p.time * 0.5);
                    // c = blend(vec4(t, t, t, 1), c);
                    float a = texture(p.tex, p.uv).a;
                    c = hue(c, a * 0.2 + p.time * 0.2);
                    float g = texture(p.glasses, p.uv).a;
                    return invert(hue(c, g * 0.2));
                }
            `
        })
        blit(buf, beatmemo)
        blit(buf, lucasd)
        g.flush(buf)
    }
}

export let main = () => run(app)

