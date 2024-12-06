import {
    gfx,
    run,
    App,
    model
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({
        depth: true,
        msaa: true
    })
    let mario = await model(g, 'mario.glb')
    return async (input) => {
        buf.clear()
        mario.items.forEach((item) => {
            return buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time * 1],
                    ['color', item.color]    
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(80., v.aspect, 0.1, 5000.);
                        mat4 view = lookat(
                            vec3(0., 0., 5.01),
                            vec3(0., 0., 0.)
                        ) * translate(0., 1.9, 0.);
                        float s = 1.;
                        mat4 model = rotatey(v.time);
                        return mat4[3](proj, inverse(view), model);
                    }
                    float cel(float f) {
                        f *= 0.67;
                        return f;
                    }
                    vec4 pixel(px p) {
                        vec3 light = vec3(-100, 100, -20);
                        float s = specular(light, p.pos, p.normal, p.eye, 50.);
                        float d = diffuse(light, p.pos, p.normal);
                        d = cel(d);
                        vec4 c = mix(texture(p.color, p.uv), vec4(0, 0, 0, 1), d);
                        return mix(c, vec4(1), s);
                        return texture(p.color, 1. - p.uv);
                        // return vec4(p.normal.x, p.normal.y, p.normal.z, 1);
                        return vec4(p.uv.x, p.uv.y, 1, 1);
                    }
                `
            })
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
