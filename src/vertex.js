import {Vec4, Mat4} from "./math";

export default class Vertex {
    constructor() {
        this.pos = new Vec4(0.0, 0.0, 0.0, 0.0);
        this.color = new Vec4(0.0, 0.0, 0.0, 0.0);
        this.texcoords = new Vec4(0.0, 0.0, 0.0, 0.0);
    }

    set(n_pos, n_color, n_texcoords) {
        this.pos = n_pos;
        this.color = n_color;
        this.texcoords = n_texcoords;
        
        return this;
    }

    transform(mat) {
        return new Vertex().set(
            mat.transform(this.pos),
            this.color,
            this.texcoords
        )
    }

    perspective_divide() {
        return new Vertex().set(
            new Vec4(this.pos.x / this.pos.w, this.pos.y / this.pos.w, this.pos.z / this.pos.w, this.pos.w),
            this.color,
            this.texcoords
        );
    }

    lerp(vert_other, t) {
        return new Vertex().set(
            Vec4.lerp(this.pos, vert_other.pos, t),
            Vec4.lerp(this.color, vert_other.color, t),
            Vec4.lerp(this.texcoords, vert_other.texcoords, t)
        );
    }

    triangle2a(b, c) {
        let x1 = b.pos.x - this.pos.x;
        let y1 = b.pos.y - this.pos.y;
        let x2 = c.pos.x - this.pos.x;
        let y2 = c.pos.y - this.pos.y;
        return (x1 * y2 - x2 * y1);
    }

    inside_view() {
        return Math.abs(this.pos.x) <= Math.abs(this.pos.w) &&
                Math.abs(this.pos.y) <= Math.abs(this.pos.w) &&
                Math.abs(this.pos.z) <= Math.abs(this.pos.w);
    }

    get_index(i) {
        switch(i) {
            case 0: return this.pos.x;
            case 1: return this.pos.y;
            case 2: return this.pos.z;
            case 3: return this.pos.w;
        }

        return 0;
    }
}