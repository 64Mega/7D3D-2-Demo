import Edge from "./edge";
import {Mat4, Vec4} from "./math";
import Lerp from "./lerper";
// Renderererer
// --

class Renderer {
    constructor(drawPixel, w, h) {
        this.screen = {
            draw: drawPixel,
            w, h
        };

        this.wireframe = false;
    }

    fill_tri(vert1, vert2, vert3, texture) {
        let sst = Mat4.SCREEN_SPACE_TRANSFORM(this.screen.w, this.screen.h);
        let minv = vert1.transform(sst).perspective_divide();
        let midv = vert2.transform(sst).perspective_divide();
        let maxv = vert3.transform(sst).perspective_divide();

        if(maxv.pos.y < midv.pos.y) {
            [midv, maxv] = [maxv, midv];            
        }
        if(midv.pos.y < minv.pos.y) {
            [minv, midv] = [midv, minv];
        }
        if(maxv.pos.y < midv.pos.y) {
            [midv, maxv] = [maxv, midv];
        }

        this.scan_tri(minv, midv, maxv, minv.triangle2a(maxv, midv) >= 0, texture);
    }

    scan_tri(vert_top, vert_mid, vert_bot, side, texture) {
        let lerps = new Lerp(vert_top, vert_mid, vert_bot);
        let edge_top_bottom = new Edge(lerps, vert_top, vert_bot, 0);
        let edge_top_mid = new Edge(lerps, vert_top, vert_mid, 0);
        let edge_mid_bottom = new Edge(lerps, vert_mid, vert_bot, 1);

        this.scan_edges(lerps, edge_top_bottom, edge_top_mid, side, texture);
        this.scan_edges(lerps, edge_top_bottom, edge_mid_bottom, side, texture);
    }

    scan_edges(lerps, edge_a, edge_b, side, texture) {
        let left = edge_a;
        let right = edge_b;
        if(side === true) {
            [right, left] = [left, right]; // Gotta love es6 swaps.
        }

        let y_start = edge_b.y_start;
        let y_end = edge_b.y_end;

        for(let j = y_start; j < y_end; j++) {
            this.draw_scanline(lerps, left, right, j, texture);
            left.step();
            right.step();
        }
    }

    draw_scanline(lerps, edge_left, edge_right, j, texture) {
        let x_min = Math.ceil(edge_left.x);
        let x_max = Math.ceil(edge_right.x);
        let x_prestep = x_min - edge_left.x;

        //let texco_x = edge_left.texcoord_x + lerps.texcoord_xx_step * x_prestep;
        //let texco_y = edge_left.texcoord_y + lerps.texcoord_yx_step * x_prestep;

        let x_dist = edge_right.x - edge_left.x;
        let texco_xx_step = (edge_right.texcoord_x - edge_left.texcoord_x) / x_dist;
        let texco_yx_step = (edge_right.texcoord_y - edge_left.texcoord_y) / x_dist;
        let one_over_zx_step = (edge_right.one_over_z - edge_left.one_over_z) / x_dist;

        let texco_x = edge_left.texcoord_x + texco_xx_step * x_prestep;
        let texco_y = edge_left.texcoord_y + texco_yx_step * x_prestep;
        let one_over_z = edge_left.one_over_z + one_over_zx_step * x_prestep;

        let col = edge_left.color.add(lerps.color_xstep.mul(x_prestep));
        //let col = new Vec4(1.0, 1.0, 1.0, 1.0);

        for(let i = x_min; i < x_max; i++) {            
            //let srcx = Math.floor(texco_x * (texture.width - 1) + 0.5);
            //let srcy = Math.floor(texco_y * (texture.height - 1) + 0.5);

            let z = 1.0 / one_over_z;
            let srcx = Math.floor((texco_x * z) * (texture.width - 1) + 0.5);
            let srcy = Math.floor((texco_y * z) * (texture.height - 1) + 0.5);

            let srcidex = (srcy * (texture.width * 4) + (srcx * 4));
            let r = Math.ceil(texture.data[srcidex] * col.x);
            let g = Math.ceil(texture.data[srcidex + 1] * col.y);
            let b = Math.ceil(texture.data[srcidex + 2] * col.z);
            let a = Math.ceil(texture.data[srcidex + 3] * col.a);

            if(this.wireframe === false) {
                this.screen.draw(i, j, r, g, b, 255);
            } else {
                if(i === x_min || i === x_max-1) {
                    this.screen.draw(i, j, r, g, b, 255);
                }
            }
            col = col.add(lerps.color_xstep);
            //texco_x += lerps.texcoord_xx_step;
            //texco_y += lerps.texcoord_yx_step;
            one_over_z += one_over_zx_step;
            texco_x += texco_xx_step;
            texco_y += texco_yx_step;
        }        
    }
}

export default Renderer;