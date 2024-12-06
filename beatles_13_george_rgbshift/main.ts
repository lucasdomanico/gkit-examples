import {
    gfx,
    run,
    App,
    image,
    record,
    blit,
    Buffer,
    Texture
} from '../../@gkit/gkit.js'

let draw_outline = (buf:Buffer, outline:Texture, time:number, offset:number, color:number) => {
    buf.draw({
        uniforms: [
            ['tex', outline],
            ['time', time],
            ['offset', offset],
            ['color', color],
        ],
        shader: `
            vec4 pixel(px p) {
                float f = vnoise(((p.uv * 10.) + p.offset + p.time), 5);
                f = f * 2. - 1.;
                f *= 0.04;
                return hue(texture(p.tex, p.uv + f), p.color);
            }
        `
    })    
}

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1000, 1000))
    let buf = g.buffer()
    let george = g.texture(await image('george.png'))
    let outline = g.texture(await image('outline.png'))
    let beatmemo = g.texture(await image('beatmemo.png'))
    let droidez = g.texture(await image('droidez.png'))
    let huebuf = g.buffer()
    return async (input) => {
        buf.clear()
        blit(buf, george)
        draw_outline(buf, outline, input.time, 0, 0)
        draw_outline(buf, outline, input.time, 100, 0.333)
        draw_outline(buf, outline, input.time, 1000, 0.666)
        blit(buf, beatmemo)
        blit(buf, droidez)
        huebuf.draw({
            shader: `
                vec4 pixel(px p) {
                    return vec4(1);
                }
            `
        })
        huebuf.draw({
            uniforms: [
                ['tex', buf.color(0)],
                ['time', input.time]    
            ],
            shader: `
                vec4 pixel(px p) {
                    return hue(texture(p.tex, p.uv), p.time * 0.25);
                }
            `
        })
        g.flush(huebuf)
    }
}

export let main = () => run(app)
