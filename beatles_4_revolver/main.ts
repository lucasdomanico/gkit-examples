const range = (start:number, stop?:number, step?:number):number[] => {
    if(stop === undefined) {
        stop = start
        start = 0
    }
    if(step === undefined) {
        step = 1
    }
    if((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return []
    }
    var result = [] as number[]
    for(let i = start; step > 0? i < stop : i > stop; i += step) {
        result.push(i)
    }
    return result
}

import {
    gfx,
    blit,
    run,
    App,
    image,
    curve,
    record,
    UniformArray
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({
        depth: true
    })
    let paul = g.texture(await image('paul.png'))
    let droidez = g.texture(await image('droidez.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let curves = range(10).map((i) => {
        let h = 2
        return curve([[[-20, i * h, -10, 0, 0, -1, 0, 1, 1 , 0], [0]], [[20, i * h, -10, 0, 0, -1, 0, 1, 1, 0], [0]]])
    })
    return async (input) => {
        buf.clear(true, true)
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(1);
                }
            `
        })
        buf.draw({
            depth: true,
            uniforms: [
                ['paul', paul],
                ['time', input.time]
            ],
            shader: `
                mat4[3] vertex(vx v) {
                    mat4 camera = lookat(
                        vec3(0., 0., 10.),
                        vec3(0., 0., 0.)
                    );
                    mat4 model = rotatey((wave(v.time * 0.25) - 0.5) * 0.4) *
                        scale(20.,20.,20.);
                    model *= rotatex(sin(v.time * 0.2) * 0.04);
                    model *= translate(0., 0., 0.04);
                    return mat4[3](
                        perspective(80., v.aspect, 0.1, 1000.),
                        inverse(camera),
                        model
                    );
                }
                vec4 pixel(px p) {
                    return hue(texture(p.paul, p.uv), -p.time);
                }
            `
        })
        curves.forEach((c) => {
            let count = 4
            return range(count).forEach((i) => {
                let p = c.point((input.time + i * (1 / count)) % 1)
                return buf.draw({
                    uniforms: [
                        ['model', new UniformArray('mat4', p.matrix)]
                    ],
                    shader: `
                        mat4 vertex(vx v) {
                            mat4 proj = perspective(80., v.aspect, 0.1, 1000.);
                            mat4 view = lookat(
                                vec3(0., -3., 1.),
                                vec3(0)
                            );
                            return proj * inverse(view) * v.model;
                        }
                        vec4 pixel(px p) {
                            return vec4(1, 0, 0, 1);
                        }
                    `
                })
            })
        })
        blit(buf, droidez)
        blit(buf, beatmemo)
        g.flush(buf)
    }
}

export let main = () => run(app)
