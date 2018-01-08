// lerps
// --

import {Vec4} from "./math";

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
            v1.texcoords.x,
            v2.texcoords.x,
            v3.texcoords.x,
        ];
        this.texcoord_y = [
            v1.texcoords.y,
            v2.texcoords.y,
            v3.texcoords.y
        ];

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