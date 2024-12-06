import {
    gfx,
    model,
    image,
    App,
    run,
    record
} from '../../@gkit/gkit.js'

export let app:App = async (path, canvas) => {
    let g = gfx(canvas(1400, 1400))
    let buf = g.buffer({ depth:true, msaa:true })
    let tile = g.texture(await image('tile.png'))
    let arwing = await model(g, 'arwing.gltf')
    let fov = 90
    let x = 0
    let y = 0
    let z = 10
    return async (input) => {
        if(input.key('KeyA')) x -= 0.2
        if(input.key('KeyD')) x += 0.2
        if(input.key('KeyS')) y -= 0.1
        if(input.key('KeyW')) y += 0.1
        if(input.key('KeyQ')) z -= 0.1
        if(input.key('KeyE')) z += 0.1
        if(input.key('KeyZ')) fov -= 0.1
        if(input.key('KeyX')) fov += 0.1
        x = Math.max(x, -7)
        x = Math.min(x, 7)
        y = Math.max(y, -4.8)
        y = Math.min(y, 41.8)
        buf.clear()
        buf.draw({
            uniforms: [
                ['time', input.time],
                ['tile', tile],
                ['fov', fov],
                ['x', x],
                ['y', y],
                ['z', z]    
            ],
            shader: `
                mat4[3] vertex(vx v) {
                    mat4 proj = perspective(v.fov, v.aspect, 1., 50.);
                    mat4 view = lookat(
                        vec3(v.x, v.y, v.z),
                        vec3(0., 0., 0.)
                    );
                    float s = 1000.;
                    mat4 model =
                        translate(0., -5., mod(v.time * 30. * 0.5, 10.))
                        * scale(s, s, s)
                        * rotatex(-pi / 2.)
                        ;
                    return mat4[3](proj, inverse(view), model);
                }
                vec4 pixel(px p) {
                    float w = 20.;
                    float h = 20.;
                    float x = mod(p.uv.x, 1. / w) * w;
                    float y = mod(p.uv.y, 1. / h) * h;
                    return texture(p.tile, vec2(x, y));
                    return vec4(x, y, 1, 1);
                }
            `
        })
        arwing.items.forEach((item) => {
            buf.draw({
                depth: true,
                mesh: item.mesh,
                uniforms: [
                    ['time', input.time],
                    ['color', item.color],
                    ['fov', fov],
                    ['x', x],
                    ['y', y],
                    ['z', z]    
                ],
                shader: `
                    mat4[3] vertex(vx v) {
                        mat4 proj = perspective(v.fov, v.aspect, 1., 50.);
                        mat4 view = lookat(
                            vec3(v.x, v.y, v.z),
                            vec3(0., 0., 0.)
                        );
                        mat4 model = mat4(1)
                            * translate(0., wave(v.time * 0.4) * 0.35, 0.)
                            * translate(0., -2., 0.)
                            * rotatey(pi)
                            * scale(4., 4., 4.)
                            ;
                        return mat4[3](proj, inverse(view), model);
                    }
                    vec4 pixel(px p) {
                        return texture(p.color, p.uv);
                    }
                `
            })
        })
        g.flush(buf)
    }
}

export let main = () => run(app)
