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

    triangle2a(b, c) {
        let x1 = b.pos.x - this.pos.x;
        let y1 = b.pos.y - this.pos.y;
        let x2 = c.pos.x - this.pos.x;
        let y2 = c.pos.y - this.pos.y;
        return (x1 * y2 - x2 * y1);
    }
}