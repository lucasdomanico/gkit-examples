import {
    gfx,
    image,
    App,
    run,
    atlas
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer()
    let tile = 96
    let mahjong = atlas(await image('mahjong.png'), tile, tile).map((r) => r.map((e) => g.texture(e)))
    let back = g.texture(await image('back.png'))
    let front = g.texture(await image('front.png'))
    return async (input) => {
        buf.clear()
        mahjong.forEach((r, i) => r.forEach((tex, j) => {
            buf.draw({
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
        g.flush(buf)
    }
}

export let main = () => run(app)
