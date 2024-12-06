import {
    gfx,
    image,
    App,
    run
} from '../../@gkit/gkit.js'

export let flow = `
    float flow_vnoise(vec2 p) {
        #define rand(f) fract(sin(f) * 10000.)   
        #define rand2d(x, y) rand(x + y * 100.)    // OG 10000.
        float sw = rand2d(floor(p.x), floor(p.y));
        float se = rand2d(ceil(p.x),  floor(p.y));
        float nw = rand2d(floor(p.x), ceil(p.y));
        float ne = rand2d(ceil(p.x),  ceil(p.y));
        #undef rand
        #undef rand2d
        vec2 inter = smoothstep(0., 1., fract(p));
        float s = mix(sw, se, inter.x);
        float n = mix(nw, ne, inter.x);
        return mix(s, n, inter.y);
    }
    float flow_fbm(vec2 p, float time) {
        float total = 0.0;
        total += flow_vnoise(p       - time);
        total += flow_vnoise(p * 2.  + time) / 2.;
        total += flow_vnoise(p * 4.  - time) / 4.;
        total += flow_vnoise(p * 8.  + time) / 8.;
        total += flow_vnoise(p * 16. - time) / 16.;
        total /= 1. + 1./2. + 1./4. + 1./8. + 1./16.;
        return total;
    }
    float flow(vec2 uv, float aspect, float scale, float angle, float time) {
        angle = -angle + pi * 0.25;  // right
        uv = uv - 0.5;               // pivot center
        if(aspect > 1.) uv.x *= aspect;
        else            uv.y *= 1. / aspect;
        uv = (rotatez(angle) * vec4(uv, 1, 1)).xy;
        uv *= scale;
        float x = flow_fbm(uv, time);
        float y = flow_fbm(uv + 100., time);
        return flow_fbm(uv + vec2(x, y), time);
    }
`

export let displace = flow + `
    float classic_flow(vec2 uv, float time) {
        return flow(uv * 10. + 0.5, 1., 1., radians(45.), time);
    }
    vec4 displace(sampler2D img, vec2 uv, float strength, float time, float scale) {
        float n = classic_flow(uv * scale, time * 1.2);
        return texture(img, uv + strength * 0.005 * sin(n * pi * 2.0));
    }
`

export let camera = `
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
        return perspective(42., aspect, 0.1, 10000.) * view(time);
        // return perspective(68.621, aspect, 0.1, 10000.) * view(time);
    }
`

export let mist = displace + `
    vec4 mist(vec4 c, vec2 uv, float time) {
        vec3 hsv = rgbtohsv(c.rgb);
        float n = classic_flow(uv, time * 1.6);
        c.rgb = hsvtorgb(vec3(n * 0.3 + 0.7, 1.0, hsv.z));
        return c;
    }
`

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1920, 1080))
    let bg = g.texture(await image(path + 'bg.png'))
    let dispbg = g.texture(await image(path + 'displace.png'))
    let lights = g.texture(await image(path + 'lights.png'))
    let lennon = g.texture(await image(path + 'lennon.png'))
    let displace_lennon = g.texture(await image(path + 'displace_lennon.png'))
    let front = g.texture(await image(path + 'front.png'))
    let buf = g.buffer()
    let gbuf = g.buffer()
    return async (input) => {
        let time = input.time
        buf.draw({
            clear: true,
            uniforms: [
                ['time', time],
                ['bg', bg],
                ['dispbg', dispbg]
            ],
            shader: camera + mist + `
                mat4 vertex(vx a) {
                    float size = 4032.;
                    return camera(a.time, a.aspect) *
                        translate(0., 0., -1600.) *
                        scale(size, size * (1. / a.aspect), 1.);
                }
                vec4 pixel(px a) {
                    vec4 c = displace(a.bg, a.uv, texture(a.dispbg, a.uv).x, a.time + 1., 1.);
                    return mist(c, a.uv, a.time + 1.);
                }
            `
        })
        buf.draw({
            uniforms: [
                ['time', time],
                ['lights', lights]
            ],
            shader: camera + `
                mat4 vertex(vx a) {
                    float size = 4032.;
                    return camera(a.time, a.aspect) *
                        translate(0., 0., -1600.) *
                        scale(size, size * (1. / a.aspect), 1.);
                }
                vec4 pixel(px a) {
                    return hue(texture(a.lights, a.uv), -a.time);
                }
            `
        })
        buf.draw({
            uniforms: [
                ['time', time],
                ['lennon', lennon],
                ['displace_lennon', displace_lennon]
            ],
            shader: camera + mist + `
                mat4 vertex(vx a) {
                    float size = 1344.;
                    return camera(a.time, a.aspect) *
                        translate(50., -50., 0.) *
                        scale(size, size * (1. / a.aspect), 1.);
                }
                vec4 pixel(px a) {
                    vec4 c = displace(a.lennon, a.uv, texture(a.displace_lennon, a.uv).x, a.time + 1., 1.);
                    return mist(c, a.uv, a.time + 1.);
                }
            `
        })
        buf.draw({
            uniforms: [
                ['time', time],
                ['front', front]
            ],
            shader: camera + mist + `
                mat4 vertex(vx a) {
                    float size = 960.;
                    return camera(a.time, a.aspect) *
                        translate(0., 0., 250.) *
                        scale(size, size * (1. / a.aspect), 1.);
                }
                vec4 pixel(px a) {
                    return mist(texture(a.front, a.uv), a.uv, a.time + 1.);
                }
            `
        })
        gbuf.draw({
            clear: true,
            uniforms: [
                ['time', time],
                ['image', buf.color(0)]
            ],
            shader: mist + `
                float strength(float time) {
                    float zblur = 0.02;
                    float ms = 8.0;
                    float cycles = 1.4;
                    float full = mod(time, ms * cycles);
                    if(full < ms) {
                        if(full > (ms/2.0)) full = ms - full;
                        full /= ms/2.0;
                        zblur *= full;
                    }
                    else zblur = 0.0;
                    return zblur;
                }
                vec4 pixel(px a) {
                    vec4 bg = vec4(0., 0., 0., 1.);
                    return blend(bg, zoomblur(a.image, a.uv, 0.7, 0.3, strength(a.time)));
                }
            `
        })
        g.flush(gbuf)
    }
}

export let main = () => run(app)