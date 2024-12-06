import {
    gfx,
    run,
    App,
    image,
    blur,
    record,
    blit
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer()
    let img = g.texture(await image('bunny.png'))
    let newbuf = () => g.buffer({
        width: g.width() * 0.2,
        height: g.height() * 0.2
    })
    let bufs = [newbuf(), newbuf()]
    return async (input) => {
        blur(img, bufs[0], bufs[1], 5, 0.002)
        buf.draw({
            clear: true,
            uniforms: [
                ['img', img],
                ['time', input.time],
                ['mask', bufs[1].color(0)]    
            ],
            shader: `
                vec4 pixel(px p) {
                    if(texture(p.mask, p.uv).a == 0.) return vec4(0);
                    vec4 c = texture(p.img, p.uv);
                    if(c.a == 1.) return vec4(0);
                    float o = outline(p.img, p.uv, 0.02);
                    if(o < 0.001) return vec4(0);
                    vec3 hsv;
                    hsv.x = o + p.time;
                    hsv.y = 1.;
                    hsv.z = 1.;
                    vec3 rgb = hsvtorgb(hsv);
                    return vec4(rgb, 1);
                }
            `
        })
        blit(buf, img)
        g.flush(buf)
    }
}

export let main = () => run(app)
