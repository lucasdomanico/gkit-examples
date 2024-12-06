import {
    gfx,
    App,
    run
} from '../../@gkit/gkit.js'

export type video_ready = (v:HTMLVideoElement) => Promise<void>
export const video_ready:video_ready = (v) => new Promise((resolve, reject) => {
    return v.onloadeddata = () => resolve()
})

export type video = (src:string) => Promise<HTMLVideoElement>
export const video:video = async (src) => {
    let v = document.createElement('video')
    v.src = src
    v.muted = true
    v.autoplay = true
    v.controls = true
    v.loop = true
    await video_ready(v)
    return v
}

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer()
    let v = await video('red.mp4')
    let vtex = g.texture(v)
    return async (input) => {
        v.currentTime = input.time % v.duration
        vtex.set(v)
        buf.draw({
            clear: true,
            uniforms: [
                ['tex', vtex]
            ],
            shader: `
                vec4 pixel(px p) {
                    vec4 c = texture(p.tex, p.uv);
                    float g = (c.x + c.y + c.z) / 3.;
                    float a = (0.5 - (c.r - g)) * 2.;
                    return vec4(g, g, g, 1) * a;
                }
            `
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
