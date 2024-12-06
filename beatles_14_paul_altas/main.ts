import {
    gfx,
    image,
    App,
    run,
    record,
    atlas,
    blit
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer()
    let mbuf = g.buffer()
    let tile = 96
    let mahjong = atlas(await image('mahjong.png'), tile, tile).map((r) => r.map((e) => g.texture(e)))
    let back = g.texture(await image('back.png'))
    let front = g.texture(await image('front.png'))
    let paul = g.texture(await image('paul.png'))
    let hair = g.texture(await image('hair.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let lucasd = g.texture(await image('droidez.png'))
    return async (input) => {
        mbuf.clear()
        mahjong.forEach((r, i) => r.forEach((tex, j) => {
            mbuf.draw({
                cull: 'none',
                uniforms: [
                    ['tex', tex],
                    ['btex', back],
                    ['ftex', front],
                    ['i', i],
                    ['j', j],
                    ['time', input.time]
                ],
                shader: `
                    mat4 vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.1, 1000.);
                        mat4 view = translate(3.5, 2.5, 5.);
                        mat4 model = translate(v.j, v.i, 0.) * rotatey(v.time);
                        return proj * inverse(view) * model;
                    }
                    vec4 pixel(px p) {
                        if(p.front) {
                            return blend(texture(p.ftex, p.uv), texture(p.tex, p.uv));
                        }
                        return texture(p.btex, p.uv);
                    }
                
                `
            })
        }))
        buf.clear()
        buf.draw({
            uniforms: [
                ['tex', paul],
                ['m', mbuf.color()],
                ['time', input.time],
                ['hair', hair]
            ],
            shader: `
                vec4 pixel(px p) {
                    float offset = 0.;
                    if(texture(p.hair, p.uv).a != 0.) {
                        float f = vnoise(p.uv * 10. + p.time * 0.1, 5) * 2. - 1.;
                        f *= 0.2;
                        offset = f;
                    }
                    vec4 c = multiply(texture(p.tex, p.uv), texture(p.tex, p.uv + offset));
                    return overlay(texture(p.m, p.uv), c);
                }
            `
        })
        blit(buf, beatmemo)
        blit(buf, lucasd)
        g.flush(buf)
    }
}

export let main = () => run(app)
