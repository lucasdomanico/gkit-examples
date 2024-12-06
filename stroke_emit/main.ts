import {
    gfx,
    App,
    run,
    curve,
    particle,
    Particle
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({ depth:true })
    let curve_1 = curve([
        [[-4, 0, -4,  1, 0,  0,           0, 1, 1, 1], [0, 1]],
        [[ 0, 0, -2,  0, 0, -1, Math.PI * 4, 1, 2, 1], [1, 1]],
        [[ 0, 0, -4,  0, 0, -1, Math.PI * 4, 1, 1, 1], [1, 1]],
        [[ 4, 0, -4, -1, 0,  0,           0, 1, 1, 1], [0, 1]]
    ])
    let uvbuf = g.buffer({ width:500, height:500 })
    uvbuf.draw({
        shader: `
            vec4 pixel(px p) {
                return vec4(p.uv.x, p.uv.y, 1, 1);
            }
        `
    })
    let particles = ([] as Array<Particle>)
    return async (input) => {
        if(input.key('KeyA')) {
            let p = curve_1.point(input.time * 0.4)
            let vx = Math.random() - 0.5
            let vy = Math.random() - 0.5
            let vz = Math.random() - 0.5
            particles.push(particle(p.matrix, 2, 1, 0, 0, 0, vx, vy, vz, 0.1, [1, 1], [0, 0], uvbuf.color(0)))
        }
        particles = particles.filter((p) => {
            p.delta += input.delta
            return p.delta < p.time
        })
        console.log(particles.length)
        buf.clear()
        particles.forEach((p) => {
            buf.draw({
                uniforms: p.uniforms(),
                shader: `
                    mat4 vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.01, 1000.);
                        mat4 view = translate(0., 0., 0.);
                        return proj * inverse(view) * v.model;
                    }
                ` + Particle.shader
            })
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
