// Math utilities like Vectors, Matrices and interpolation for
// vertices/textures.

export function ToRadians(angle) {
    return (Math.PI / 180.0) * angle;
}

export class Vec4 {
    constructor(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    dot(vec) {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z + this.w * vec.w;
    }

    cross(vec) {
        let xx = this.y * vec.z - this.z * vec.y;
        let yy = this.z * vec.x - this.x * vec.z;
        let zz = this.x * vec.y - this.y * vec.x;

        return new Vec4(xx, yy, zz, 0.0);
    }

    normalized() {
        let len = this.length();
        return new Vec4(this.x / len, this.y / len, this.z / len, this.w / len);
    }

    static addv(a, b) {
        return new Vec4(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w);
    }

    add(b) {
        return new Vec4(this.x + b.x, this.y + b.y, this.z + b.z, this.w + b.w);
    }

    static subv(a, b) {
        return new Vec4(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);
    }

    sub(b) {
        return new Vec4(this.x - b.x, this.y - b.y, this.z - b.z, this.w - b.w);
    }

    

    static muls(v, s) {
        return new Vec4(a.x * s, a.y * s, a.z * s, a.w * s);
    }

    mul(b) {
        return new Vec4(this.x * b, this.y * b, this.z * b, this.w * b);
    }

    static lerp(a, b, t) {
        let r = Vec4.subv(b, a);
        r = Vec4.muls(r, muls);
        r = Vec4.addv(a);
        return r;
    }
}

// Matrix4

export class Mat4 {
    constructor(mat) {
        let m = null;
        if(mat === undefined) {
            m = [
                [0.0, 0.0, 0.0, 0.0],
                [0.0, 0.0, 0.0, 0.0],
                [0.0, 0.0, 0.0, 0.0],
                [0.0, 0.0, 0.0, 0.0]
            ];
        } else {
            m = mat;
        }

        this.m = m;
    }

    static IDENTITY() {
        let m = [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ];

        return new Mat4(m);
    }

    static SCREEN_SPACE_TRANSFORM(view_width, view_height) {
        let hw = view_width / 2.0;
        let hh = view_height / 2.0;

        let m = [
            [ hw,       0.0,        0.0,         hw],
            [0.0,       -hh,        0.0,         hh],
            [0.0,       0.0,        1.0,        0.0],
            [0.0,       0.0,        0.0,        1.0],
        ];

        return new Mat4(m);
    }

    static TRANSLATE(x, y, z) {
        let m = [
            [1.0,       0.0,        0.0,        x  ],
            [0.0,       1.0,        0.0,        y  ],
            [0.0,       0.0,        1.0,        z  ],
            [0.0,       0.0,        0.0,        1.0]
        ];

        return new Mat4(m);
    }

    static ROTATION(x, y, z, angle) {
        let rx = new Mat4();
        let ry = new Mat4();
        let rz = new Mat4();

        rz.m[0][0] = Math.cos(z); rz.m[0][1] = -Math.sin(z); rz.m[0][2] = 0.0; rz.m[0][3] = 0.0;
        rz.m[1][0] = Math.sin(z); rz.m[1][1] = Math.cos(z); rz.m[1][2] = 0.0; rz.m[1][3] = 0.0;
        rz.m[2][0] = 0.0; rz.m[2][1] = 0.0; rz.m[2][2] = 1.0; rz.m[2][3] = 0.0;
        rz.m[3][0] = 0.0; rz.m[3][1] = 0.0; rz.m[3][2] = 0.0; rz.m[3][3] = 1.0;

        rx.m[0][0] = 1.0; rx.m[0][1] = 0.0; rx.m[0][2] = 0.0; rx.m[0][3] = 0.0; 
        rx.m[1][0] = 0.0; rx.m[1][1] = Math.cos(x); rx.m[1][2] = -Math.sin(x); rx.m[1][3] = 0.0; 
        rx.m[2][0] = 0.0; rx.m[2][1] = Math.sin(x); rx.m[2][2] = Math.cos(x); rx.m[2][3] = 0.0; 
        rx.m[3][0] = 0.0; rx.m[3][1] = 0.0; rx.m[3][2] = 0.0; rx.m[3][3] = 1.0; 

        ry.m[0][0] = Math.cos(y); ry.m[0][1] = 0.0; ry.m[0][2] = -Math.sin(y); ry.m[0][3] = 0.0; 
        ry.m[1][0] = 0.0; ry.m[1][1] = 1.0; ry.m[1][2] = 0.0; ry.m[1][3] = 0.0; 
        ry.m[2][0] = Math.sin(y); ry.m[2][1] = 0.0; ry.m[2][2] = Math.cos(y); ry.m[2][3] = 0.0; 
        ry.m[3][0] = 0.0; ry.m[3][1] = 0.0; ry.m[3][2] = 0.0; ry.m[3][3] = 1.0; 

        return Mat4.mul(rz, Mat4.mul(ry, rx));
    }

    static SCALE(x, y, z) {
        let m = [
            [  x,       0.0,        0.0,        0.0],
            [0.0,         y,        0.0,        0.0],
            [0.0,       0.0,          z,        0.0],
            [0.0,       0.0,        0.0,        1.0]
        ];

        return new Mat4(m);
    }

    static PERSPECTIVE(fov, aspect, near, far) {
        let hfov = Math.tan(fov / 2.0);
        let zrange = near - far;

        let m = [
            [0.0,       0.0,        0.0,        0.0],
            [0.0,       0.0,        0.0,        0.0],
            [0.0,       0.0,        0.0,        0.0],
            [0.0,       0.0,        0.0,        0.0]
        ];

        m[0][0] = 1.0 / (hfov * aspect);
        m[0][1] = 0.0;
        m[0][2] = 0.0;
        m[0][3] = 0.0;

        m[1][0] = 0.0;
        m[1][1] = 1.0 / hfov;
        m[1][2] = 0.0;
        m[1][3] = 0.0;

        m[2][0] = 0.0;
        m[2][1] = 0.0;
        m[2][2] = (-near - far) / zrange;
        m[2][3] = 2.0 * far * near / zrange;

        m[3][2] = 1.0;
        m[3][3] = 0.0;

        return new Mat4(m);
    }

    static ORTHO(left, right, bottom, top, near, far) {
        let width = right - left;
        let height = top - bottom;
        let depth = far - near;

        let m = [
            [0.0,       0.0,        0.0,        0.0],
            [0.0,       0.0,        0.0,        0.0],
            [0.0,       0.0,        0.0,        0.0],
            [0.0,       0.0,        0.0,        0.0]
        ];

        m[0][0] = 2.0 / width;
        m[0][1] = 0.0;
        m[0][2] = 0.0;
        m[0][3] = -(right + left) / width;

        m[1][0] = 0.0;
        m[1][1] = 2 / height;
        m[1][2] = 0.0;
        m[1][3] = -(top + bottom) / height;

        m[2][0] = 0.0;
        m[2][1] = 0.0;
        m[2][2] = -2.0 / depth;
        m[2][3] = -(far + near) / depth;

        m[3][3] = 1.0;

        return new Mat4(m);
    }

    static mul(a, b) {
        let c = new Mat4();
        for(let iy = 0; iy < 4; iy++) {
            for(let ix = 0; ix < 4; ix++) {
                c.m[iy][ix] = 
                    a.m[iy][0] * b.m[0][ix] +
                    a.m[iy][1] * b.m[1][ix] +
                    a.m[iy][2] * b.m[2][ix] +
                    a.m[iy][3] * b.m[3][ix];
            }
        }

        return c;
    }

    transform(v) {
        let m = this.m;
        return new Vec4(
            m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z + m[0][3] * v.w,
            m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z + m[1][3] * v.w,
            m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z + m[2][3] * v.w,
            m[3][0] * v.x + m[3][1] * v.y + m[3][2] * v.z + m[3][3] * v.w
        );
    }
}