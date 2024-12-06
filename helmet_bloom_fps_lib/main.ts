import {
    gfx,
    run,
    model,
    App,
    image,
    blur,
    Texture,
    Buffer,
} from '../../@gkit/gkit.js'

export class AfterImgOptions { constructor(
    public fps?:number,
    public damp?:number,
    public blur_n?:number,
    public blur_strength?:number
    ) {}
}

export const afterimg = (acc:number, tex:Texture, bufs:[Buffer, Buffer], blurbufs:[Buffer, Buffer], delta:number, options?:AfterImgOptions):number => {
    let o_fps = options?.fps?? 10
    let o_damp = options?.damp?? 0.94
    let o_blur_n = options?.blur_n?? 10
    let o_blur_strength = options?.blur_strength?? 0.002
    let bufa = bufs[0]
    let bufb = bufs[1]
    acc += delta
    acc = Math.min(acc, 1)
    if(acc < o_fps / 1000) {
        return acc
    }
    for(;;) {
        bufa.draw({
            clear: true,
            uniforms: [
                ['old', bufb.color(0)],
                ['damp', o_damp]    
            ],
            shader: `
                vec4 pixel(px p) {
                    return texture(p.old, p.uv) * p.damp;
                }
            `
        })
        bufb.draw({
            clear: true,
            uniforms: [
                ['tex', tex],
                ['old', bufa.color(0)]
            ],
            shader: `
                vec4 pixel(px p) {
                    vec4 n = texture(p.tex, p.uv);
                    vec4 o = texture(p.old, p.uv);
                    return blend(n, o);
                }
            `
        })
        blur(bufb.color(0), blurbufs[0], blurbufs[1], o_blur_n, o_blur_strength)
        acc -= o_fps / 1000
        if(acc < o_fps / 1000) return acc
    }
}

export class AfterImg { constructor(
    public acc:number = 0,
    public process:(tex:Texture, bloomswap:[Buffer, Buffer], blurbufs:[Buffer, Buffer], delta:number, o?:AfterImgOptions) => void =
        (tex, bloomswap, blurbufs, delta, o) => {
            this.acc = afterimg(this.acc, tex, bloomswap, blurbufs, delta, o)
        }
    ) {}
}

export type clamp = (x:number) => number
export const clamp:clamp = (x) => {
    return Math.max(Math.min(x, 1), 0)
}

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer({ depth:true, msaa:true })
    let bufmix = g.buffer()
    let bloom = g.buffer({
        depth: true,
        msaa: true,
        width: g.width() / 4,
        height: g.height() / 4,
        colors: ['rgba32f']
    })
    let bloomswap:[Buffer, Buffer] = [g.buffer(), g.buffer()]
    let newblur = () => g.buffer({
        width: g.width() / 4,
        height: g.height() / 4
    })
    let blurbufs:[Buffer, Buffer] = [newblur(), newblur()]
    let helmet = await model(g, 'helmet.glb')
    let env = g.texture(await image('env.png'))
    let dobloom = false
    let dobloom_value = 0
    let ry = 0
    let afterimg = new AfterImg()
    // console.log(helmet)
    return async (input) => {
        if(input.clicks.length) dobloom = !dobloom
        if(input.key('KeyA')) ry -= input.delta
        if(input.key('KeyS')) ry += input.delta
        dobloom_value += (dobloom? 1 : -1) * input.delta
        dobloom_value = clamp(dobloom_value)
        let vertex = `
            mat4[3] vertex(vx v) {
                mat4 proj = perspective(80., v.aspect, 0.1, 5000.);
                mat4 view = lookat(
                    vec3(0., 0., 2.01),
                    vec3(0., 0., 0.)
                ) * translate(0., 0., 0.);
                float s = 1.;
                // mat4 model = rotatey(v.time * 0.5 + pi * 2.);
                mat4 model = rotatey(v.ry + pi * 2.);
                model *= rotatex(pi / 2.);
                return mat4[3](proj, inverse(view), model);
            }
        `
        bloom.clear()
        helmet.items.forEach((item) => {
            bloom.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time],
                    ['ry', ry],
                    ['emissive', item.emissive],
                    ['alpha', dobloom_value]
                ],
                shader: vertex + `
                    vec4 pixel(px p) {
                        vec4 c = texture(p.emissive, p.uv);
                        float gray = (c.x + c.y + c.z) / 3.;
                        c.a = gray;
                        c.rgb *= 1.;
                        return c * p.alpha;
                    }
                `
            })
        })
        afterimg.process(bloom.color(0), bloomswap, blurbufs, input.delta)
        buf.clear()
        helmet.items.forEach((item) => {
            buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time * 1],
                    ['ry', ry],
                    ['color', item.color],
                    ['normaltex', item.normal],
                    ['ao', item.ao],
                    ['emissive', item.emissive],
                    ['env', env]
                ],
                shader: vertex + `
                    float cel(float f) {
                        f *= 0.67;
                        return f;
                    }
                    vec4 pixel(px p) {
                        //return texture(p.ao, p.uv);
                        
                        vec3 light = vec3(-100, 100, -20);
                        vec3 normal = normalmap(p.tbn, p.normaltex, p.uv, 1.);
                        
                        // return vec4(normal.x, normal.y, normal.z, 1);
                        float s = specular(light, p.pos, normal, p.eye, 50.);
                        float d = diffuse(light, p.pos, normal);
                        d = cel(d);
                        vec4 c = mix(texture(p.color, p.uv), vec4(0, 0, 0, 1), d);
                        c = mix(c, vec4(1), s);
                        
                        // ao
                        c = mix(c, vec4(0, 0, 0, 1), 1. - texture(p.ao, p.uv).x);
                        // env
                        vec4 e = texture(p.env, matcap(p.eye, normal));
                        //c = overlay(c, e);
                        
                        c = lighten(c, texture(p.emissive, p.uv) * 2.);
                        
                        //return texture(p.emissive, p.uv);
                        
                        c = overlay(c, e);
                        
                        
                        float f = fresnel(p.pos, p.normal, p.eye);
                        c = mix(c, vec4(0, 0, 0, 1), f * f * f * f);
                        
                        return c;
                        return texture(p.color, 1. - p.uv);
                        // return vec4(p.normal.x, p.normal.y, p.normal.z, 1);
                        return vec4(p.uv.x, p.uv.y, 1, 1);
                    }
                `
            })
        })
        bufmix.clear()
        bufmix.draw({
            uniforms: [
                ['color', buf.color(0)],
                ['bloom', blurbufs[1].color(0)]
            ],
            shader: `
                vec4 pixel(px p) {
                    return blend(texture(p.color, p.uv), texture(p.bloom, p.uv));
                }
            `
        })
        g.flush(bufmix)
    }
}

export let main = () => run(app)

