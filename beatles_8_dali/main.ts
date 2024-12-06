const range = (n:number):number[] => {
    let v = Array(n) as number[]
    for(let i = 0; i < n; i++) {
        v[i] = i
    }
    return v
}

import {
    gfx,
    run,
    App,
    image,
    record,
    sphere as new_sphere,
    Buffer,
    Texture,
    blit,
} from '../../@gkit/gkit.js'


export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({
        depth: true
    })
    let tex = g.texture(await image('pepper.png'))
    let xsize = 5
    let ysize = 5
    let zsize = 5
    let sphere = g.mesh(new_sphere())
    let beatmemo = g.texture(await image('beatmemo.png'))
    let droidez = g.texture(await image('droidez.png'))
    return async (input) => {
        buf.clear()
        buf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(1);
                }
            `
        })
        range(xsize).forEach((x) => range(ysize).forEach((y) => range(zsize).forEach((z) => {
            return buf.draw({
                depth: true,
                mesh: sphere,
                uniforms: [
                    ['time', input.time],
                    ['tex', tex],
                    ['x', x + 0.5 - xsize / 2],
                    ['y', y + 0.5 - ysize / 2],
                    ['z', -z]
                ],
                shader: `
                    vec2 proj_tex(vec3 pos) {
                        mat4 proj = perspective(80., 1., 0.1, 1000.);
                        mat4 view = translate(0., 0., 1.);
                        vec4 uv = proj * inverse(view) * vec4(pos, 1);
                        if(uv.w <= 0.) return vec2(-1);
                        if(-uv.w <= uv.x
                        &&  uv.x <= uv.w
                        && -uv.w <= uv.y
                        &&  uv.y <= uv.w
                        && -uv.w <= uv.z
                        && uv.z <= uv.w) {
                            return (uv.xy / uv.w) * 0.5 + 0.5;
                        }        
                        return vec2(-1);
                    }
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.1, 1000.);
                        vec3 eye = vec3(sin(v.time), cos(v.time), 0.5);
                        mat4 view = lookat(eye, vec3(0, 0, -6.));
                        mat4 model = translate(v.x * 2., v.y * 2., -6. + v.z * 2.) *
                            scale(0.7, 0.7, 0.7);
                        return mat4[3](proj, inverse(view), model);
                    }
                    vec4 pixel(px p) {
                        float f = fresnel(p.pos, p.normal, p.eye);
                        vec4 c = texture(p.tex, proj_tex(p.pos));
                        //return mix(vec4(f), c, wave(p.time));
                        //return vec4(f);
                        //return blend(c, vec4(0, 0, 0, f) * 0.7);
                        //return blend(c, vec4(f) * wave(p.time * 0.5) * 1.);
                        return blend(c, vec4(f) * 0.4);
                        return vec4(p.normal.x, p.normal.y, p.normal.z, 1);
                    }
                `
            })
        })))
        blit(buf, beatmemo)
        blit(buf, droidez)
        g.flush(buf)
    }
}

export let main = () => run(app)

