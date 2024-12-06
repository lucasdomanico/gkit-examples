import {
    gfx,
    App,
    run,
    record,
    image,
    clamp,
    blit,
    wave,
    rescale,
} from '../../@gkit/gkit.js'

let sleep = (ms:number):Promise<void> => new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
})

class Switch {
    constructor(
        private state:boolean = false,
        private delta:number = 0,
        public on:() => void = () => {
            this.delta = Number.EPSILON
            this.state = true
        },
        public off:() => void = () => {
            this.delta = 1 - Number.EPSILON
            this.state = false
        },
        public value = (delta:number = 0) => {
            if(this.state) {
                this.delta += delta
            }
            else {
                this.delta -= delta
            }
            return clamp(this.delta)
        }
    ) {}
}

class Loading {
    constructor(
        private toggle = new Switch(),
        public start = () => {
            this.toggle.on()
        },
        public event = (delta:number, f:(value:number) => void) => {
            let value = this.toggle.value(delta)
            if(value === 0) return
            f(value)
        },
        public ready = async (f:() => Promise<void>) => {
            if(this.toggle.value() === 1) {
                await f()
                this.toggle.off()
            }
            if(this.toggle.value()) return true
            return false
        }
    ) {}
}

export let app:App = async (path, canvas, tick) => {
    let g = gfx(canvas(500, 500))
    let buf = g.buffer()
    let loading_buf = g.buffer()
    let loading_tex = g.texture(await image('loading.png'))
    let progress_tex = g.texture(await image('progress.png'))
    let loading = new Loading()
    let progress = 0
    let progress_t = 0
    let tick_sprite = g.texture(await image('ticky.png'))
    tick(async (input) => {
        loading.event(input.delta, (tween) => {
            progress_t += 0.025
            if(progress_t > progress) progress_t = progress
            console.log('LOAD', tween)
            loading_buf.draw({
                clear: true,
                uniforms: [
                    ['time', input.time],
                    ['tex', loading_tex],
                    ['tween', tween],
                    ['buf', buf.color()]
                ],
                shader: `
                    vec4 pixel(px p) {
                        vec4 c = texture(p.tex, p.uv);
                        return blend(texture(p.buf, p.uv), blend(vec4(wave(p.time), 0, 0, 1), c) * p.tween);
                    }
                `
            })
            let w = rescale(progress_t, 0, 1, 0, loading_buf.width())
            blit(loading_buf, progress_tex, 0, 100, { width:w, alpha:tween })
            g.flush(loading_buf)    
        })
    })
    return async (input) => {
        if(input.clicks.length) {
            loading.start()
            progress = 0
        }
        console.log('MAIN')
        buf.draw({
            uniforms: [
                ['time', input.time]
            ],
            shader: `
                vec4 pixel(px p) {
                    return vec4(1, 1, wave(p.time), 1);
                }
            `
        })
        blit(buf, tick_sprite, wave(input.time) * buf.width(), buf.height() / 2)
        if(await loading.ready(async () => {
            await sleep(1000)
            progress = 0.25
            await sleep(1000)
            progress = 0.5
            await sleep(1000)
            progress = 0.75
            await sleep(1000)
            progress = 1
        })) return
        g.flush(buf)
    }
}

export let main = () => run(app)

