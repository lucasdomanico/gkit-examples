import {
    random_seed as random,
} from './rand.js'

import * as three from './three/three.module.js'

export let line_width = 0.75

export let line_z_space = 1

export let path_segments_length = 50

export class Line { constructor(
    public x:number, // local 'left' vertex
    public y:number,
    public z:number,
    public x2:number, // local 'right' vertex
    public y2:number,
    public z2:number,
    public cx:number, // center vertex
    public cy:number,
    public cz:number,
    public nx:number, // normal unit vector
    public ny:number,
    public nz:number,
    public fx:number, // forward unit vector
    public fy:number,
    public fz:number,
    public tx:number, // tangent unit vector
    public ty:number,
    public tz:number
    ) {}
    static struct = (o:{ x:number, y:number, z:number, x2:number, y2:number, z2:number, cx:number, cy:number, cz:number, nx:number, ny:number, nz:number, fx:number, fy:number, fz:number, tx:number, ty:number, tz:number }) => {
        return new Line(o.x, o.y, o.z, o.x2, o.y2, o.z2, o.cx, o.cy, o.cz, o.nx, o.ny, o.nz, o.fx, o.fy, o.fz, o.tx, o.ty, o.tz)
    }
}

export class Path { constructor(
    public lines:Array<Line>
    ) {}
    static struct = (o:{ lines:Array<Line> }) => {
        return new Path(o.lines)
    }
}

export type sum_component = (x:number, x2:number) => number
export const sum_component:sum_component = (x, x2) => {
    return (x + x2) / 2
}

export type compute_center = (x:number, y:number, z:number, x2:number, y2:number, z2:number) => [number, number, number]
export const compute_center:compute_center = (x, y, z, x2, y2, z2) => {
    let cx = sum_component(x, x2)
    let cy = sum_component(y, y2)
    let cz = sum_component(z, z2);
    return [cx, cy, cz]
}

export type rotate_axis = (x:number, y:number, z:number, px:number, py:number, pz:number, ax:number, ay:number, az:number, angle:number) => [number, number, number]
export const rotate_axis:rotate_axis = (x, y, z, px, py, pz, ax, ay, az, angle) => {
    let pos = new three.Vector3(x, y, z)
    let pivot = new three.Vector3(px, py, pz)
    let axis = new three.Vector3(ax, ay, az)
    pos.sub(pivot)
    pos.applyAxisAngle(axis, angle)
    pos.add(pivot);
    return [pos.x, pos.y, pos.z]
}

export type rotate_line_angle = (line:Line, axis_x:number, axis_y:number, axis_z:number, angle:number) => void
export const rotate_line_angle:rotate_line_angle = (line, axis_x, axis_y, axis_z, angle) => {
    let az = rotate_axis(line.x, line.y, line.z, line.cx, line.cy, line.cz, axis_x, axis_y, axis_z, angle)
    let az2 = rotate_axis(line.x2, line.y2, line.z2, line.cx, line.cy, line.cz, axis_x, axis_y, axis_z, angle)
    let azn = rotate_axis(line.nx, line.ny, line.nz, 0, 0, 0, axis_x, axis_y, axis_z, angle)
    let azf = rotate_axis(line.fx, line.fy, line.fz, 0, 0, 0, axis_x, axis_y, axis_z, angle)
    let azt = rotate_axis(line.tx, line.ty, line.tz, 0, 0, 0, axis_x, axis_y, axis_z, angle)
    line.x = az[0]
    line.y = az[1]
    line.z = az[2]
    line.x2 = az2[0]
    line.y2 = az2[1]
    line.z2 = az2[2]
    line.nx = azn[0]
    line.ny = azn[1]
    line.nz = azn[2]
    line.fx = azf[0]
    line.fy = azf[1]
    line.fz = azf[2]
    line.tx = azt[0]
    line.ty = azt[1]
    return line.tz = azt[2]
}

export type rotate_line = (line:Line, angle_x:number, angle_y:number, angle_z:number) => void
export const rotate_line:rotate_line = (line, angle_x, angle_y, angle_z) => {
    rotate_line_angle(line, line.tx, line.ty, line.tz, angle_x)
    rotate_line_angle(line, line.nx, line.ny, line.nz, angle_y)
    return rotate_line_angle(line, line.fx, line.fy, line.fz, angle_z)
}

export type translate_axis = (x:number, y:number, z:number, axis_x:number, axis_y:number, axis_z:number, distance:number) => [number, number, number]
export const translate_axis:translate_axis = (x, y, z, axis_x, axis_y, axis_z, distance) => {
    let o = new three.Object3D()
    o.position.x = x
    o.position.y = y
    o.position.z = z
    o.updateMatrix()
    let axis = new three.Vector3(axis_x, axis_y, axis_z)
    o.translateOnAxis(axis, distance)
    o.updateMatrix();
    return [o.position.x, o.position.y, o.position.z]
}

export type forward_fix_line = (last:Line, line:Line) => void
export const forward_fix_line:forward_fix_line = (last, line) => {
    let v = translate_axis(last.cx, last.cy, last.cz, last.fx, last.fy, last.fz, line_z_space)
    let x = v[0]
    let y = v[1]
    let z = v[2]
    let dx = line.cx - x
    let dy = line.cy - y
    let dz = line.cz - z
    line.x += -dx
    line.y += -dy
    line.z += -dz
    line.x2 += -dx
    line.y2 += -dy
    line.z2 += -dz
    line.cx += -dx
    line.cy += -dy
    return line.cz += -dz
}

export type forward_fix = (lines:Array<Line>) => void
export const forward_fix:forward_fix = (lines) => {
    for(let i = 1; i < lines.length; i += 1) {
        let last = lines[i - 1]
        let line = lines[i]
        forward_fix_line(last, line)
    }
}

export type nested = (f:($0:number) => number) => ($0:number) => number
export const nested:nested = (f) => f

export type create_segment = (seed:number, adx:number, ady:number, adz:number, start:boolean) => [Array<Line>, number, number, number]
export const create_segment:create_segment = (seed, adx, ady, adz, start) => {
    let rands = random(seed, 4)
    let angle_xf = nested((i) => i * rands[0] * 0.4 * (random(rands[0], 1)[0] > 0.5? 1 : -1))
    let angle_yf = nested((i) => i * rands[1] * 0.4 * (random(rands[1], 1)[0] > 0.5? 1 : -1))
    let angle_zf = nested((i) => i * rands[2] * 0.4 * (random(rands[2], 1)[0] > 0.5? 1 : -1))
    let lines_length = Math.floor((rands[3]) * 12 % 12) + 4
    if(start) {
        angle_xf = () => 0
        angle_yf = () => 0
        angle_zf = () => 0
        lines_length = 12
    }
    let lines = ([] as Array<Line>)
    let angle_x = 0
    let angle_y = 0
    let angle_z = 0
    for(let i = 0; i < lines_length; i += 1) {
        let x = -line_width
        let y = 0
        let z = 0
        let x2 = line_width
        let y2 = 0
        let z2 = 0
        let cv = compute_center(x, y, z, x2, y2, z2)
        let cx = cv[0]
        let cy = cv[1]
        let cz = cv[2]
        let nx = 0
        let ny = 1
        let nz = 0
        let fx = 0
        let fy = 0
        let fz = -1
        let tx = 1
        let ty = 0
        let tz = 0
        angle_x = adx + angle_xf(i)
        angle_y = ady + angle_yf(i)
        angle_z = adz + angle_zf(i)
        let line = new Line(x, y, z, x2, y2, z2, cx, cy, cz, nx, ny, nz, fx, fy, fz, tx, ty, tz)
        rotate_line(line, angle_x, angle_y, angle_z)
        lines.push(line)
    };
    return [lines, angle_x, angle_y, angle_z]
}

export type create_path = (seed:number) => Path
export const create_path:create_path = (seed) => {
    let angle_x = 0
    let angle_y = 0
    let angle_z = 0
    let lines = ([] as Array<Line>)
    let rands = random(seed, path_segments_length)
    for(let i = 0; i < path_segments_length; i += 1) {
        let r = create_segment(rands[i], angle_x, angle_y, angle_z, i === 0 || i === path_segments_length - 1)
        angle_x = r[1]
        angle_y = r[2]
        angle_z = r[3]
        lines = lines.concat(r[0])
    }
    forward_fix(lines)
    return new Path(lines)
}

export let path = create_path

export type main = () => void
export const main:main = () => {
    return console.log(random(1, 5))
}

