// 3edgy5me
// --

import {Vec4} from "./math";

export default class Edge {
    constructor(inter, vertStart, vertEnd, top) {
        this.y_start = Math.ceil(vertStart.pos.y);
        this.y_end = Math.ceil(vertEnd.pos.y);

        let yDist = vertEnd.pos.y - vertStart.pos.y;
        let xDist = vertEnd.pos.x - vertStart.pos.x;

        this.x_step = xDist / yDist;
        let y_prestep = this.y_start - vertStart.pos.y;
        this.x = vertStart.pos.x + y_prestep * this.x_step;
        let x_prestep = this.x - vertStart.pos.x;

        this.color = new Vec4(0.0, 0.0, 0.0, 0.0);
        this.color = inter.colors[top].add(
            inter.color_ystep.mul(y_prestep)).add(
                inter.color_xstep.mul(x_prestep));
        
        this.color_step = inter.color_ystep.add(inter.color_xstep.mul(this.x_step));

        this.texcoord_x = inter.texcoord_x[top] + inter.texcoord_xx_step * x_prestep + inter.texcoord_xy_step * y_prestep;
        this.texcoord_y = inter.texcoord_y[top] + inter.texcoord_yx_step * x_prestep + inter.texcoord_yy_step * y_prestep;
        this.texcoord_step_x = inter.texcoord_xy_step + inter.texcoord_xx_step * this.x_step;
        this.texcoord_step_y = inter.texcoord_yy_step + inter.texcoord_yx_step * this.x_step;

        // Perspective interpolation
        this.one_over_z = inter.one_over_z[top] +
            inter.one_over_zx_step * x_prestep +
            inter.one_over_zy_step * y_prestep;

        this.one_over_z_step = inter.one_over_zy_step + inter.one_over_zx_step * this.x_step;

        this.depth = inter.depth[top] + 
            inter.depth_x_step * x_prestep +
            inter.depth_y_step * y_prestep;

        this.depth_step = inter.depth_y_step + inter.depth_x_step * this.x_step;
    }

    step() {
        this.x += this.x_step;
        //this.color += Vec4.addv(this.color, this.color_step);
        this.color = this.color.add(this.color_step);
        this.texcoord_x += this.texcoord_step_x;
        this.texcoord_y += this.texcoord_step_y;
        this.one_over_z += this.one_over_z_step;
        this.depth += this.depth_step;
    }
}