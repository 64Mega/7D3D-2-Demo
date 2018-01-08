// lerps
// --

import {Vec4} from "./math";

function calcstep_x(values, v1, v2, v3, odx) {
    return (((values[1] - values[2]) *
            (v1.pos.y - v3.pos.y)) -
            ((values[0] - values[2]) *
            (v2.pos.y - v3.pos.y))) * odx;
}

function calcstep_y(values, v1, v2, v3, ody) {
    return (((values[1] - values[2]) *
            (v1.pos.x - v3.pos.x)) -
            ((values[0] - values[2]) *
            (v2.pos.x - v3.pos.x))) * ody;
}

class Lerp {
    constructor(v1, v2, v3) {
        this.colors = [
            v1.color,
            v2.color,
            v3.color
        ];

        let odx = 1.0 /
            (((v2.pos.x - v3.pos.x) * 
              (v1.pos.y - v3.pos.y)) - 
             ((v1.pos.x - v3.pos.x) *
              (v2.pos.y - v3.pos.y)));
        
        let ody = -odx;

        this.one_over_z = [];
        this.one_over_zx_step = 0.0;
        this.one_over_zy_step = 0.0;

        this.one_over_z[0] = 1.0 / v1.pos.w;
        this.one_over_z[1] = 1.0 / v2.pos.w;
        this.one_over_z[2] = 1.0 / v3.pos.w;

        // Holy function call hell. I need some operator overloading over here.
        // I blew it up a bit so I could read it, but still... whew. Don't code past midnight kids.
        
        this.color_xstep =
            (
                (
                    (
                        this.colors[1].sub(
                            this.colors[2]
                        )
                    ).mul(
                        (v1.pos.y - v3.pos.y)
                    )
                ).sub(
                    (
                        (
                            this.colors[0].sub(this.colors[2])
                        )
                    ).mul(
                        (v2.pos.y - v3.pos.y)
                    )
                )
            ).mul(odx);

        this.color_ystep = 
            (
                (
                    (
                        this.colors[1].sub(this.colors[2])
                    ).mul(
                        (v1.pos.x - v3.pos.x)
                    )
                ).sub(
                    (
                        (
                            this.colors[0].sub(this.colors[2])
                        ).mul(
                            (v2.pos.x - v3.pos.x)
                        )
                    )
                )
            ).mul(ody);
 
        
        this.texcoord_x = [
            v1.texcoords.x * this.one_over_z[0],
            v2.texcoords.x * this.one_over_z[1],
            v3.texcoords.x * this.one_over_z[2],
        ];
        this.texcoord_y = [
            v1.texcoords.y * this.one_over_z[0],
            v2.texcoords.y * this.one_over_z[1],
            v3.texcoords.y * this.one_over_z[2]
        ];

        this.texcoord_xx_step = calcstep_x(this.texcoord_x, v1, v2, v3, odx);
        this.texcoord_xy_step = calcstep_y(this.texcoord_x, v1, v2, v3, ody);
        this.texcoord_yx_step = calcstep_x(this.texcoord_y, v1, v2, v3, odx);
        this.texcoord_yy_step = calcstep_y(this.texcoord_y, v1, v2, v3, ody);
        this.one_over_zx_step = calcstep_x(this.one_over_z, v1, v2, v3, odx);
        this.one_over_zy_step = calcstep_y(this.one_over_z, v1, v2, v3, ody);

        this.texcoord_xx_step = 
            (((this.texcoord_x[1] - this.texcoord_x[2]) *
            (v1.pos.y - v3.pos.y)) -
            ((this.texcoord_x[0] - this.texcoord_x[2]) *
            (v2.pos.y - v3.pos.y))) * odx;

        this.texcoord_xy_step = 
            (((this.texcoord_x[1] - this.texcoord_x[2]) *
            (v1.pos.x - v3.pos.x)) -
            ((this.texcoord_x[0] - this.texcoord_x[2]) *
            (v2.pos.x - v3.pos.x))) * ody;

        this.texcoord_yx_step =
            (((this.texcoord_y[1] - this.texcoord_y[2]) *
            (v1.pos.y - v3.pos.y)) -
            ((this.texcoord_y[0] - this.texcoord_y[2]) *
            (v2.pos.y - v3.pos.y))) * odx;

        this.texcoord_yy_step = 
            (((this.texcoord_y[1] - this.texcoord_y[2]) *
            (v1.pos.x - v3.pos.x)) -
            ((this.texcoord_y[0] - this.texcoord_y[2]) *
            (v2.pos.x - v3.pos.x))) * ody;
    }
}

export default Lerp;