export class Point { constructor(
    public x:number,
    public y:number) {}
    static struct = (o:{ x:number, y:number }) => {
        return new Point(o.x, o.y)
    }
}
