// Game/Engine entry point

import {VGAPalette, ShiftTable, PaletteShiftRight, PaletteSet} from './palette';
import {Vec4, Mat4, ToRadians} from "./math";
import Vertex from "./vertex";
import Edge from "./edge";
import Renderer from "./render.js";
import Lerp from "./lerper";
import {Mesh} from "./mesh";
import {map_01, map_0} from "./maps/map01";

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let Game = {
    canvas : null,
    context : null,
    resolution: new Vec2(320, 200),
    renderResolution: new Vec2(320,200)
};

Game.canvas = document.getElementById("RenderCanvas");
Game.canvas.width = Game.resolution.x;
Game.canvas.height = Game.resolution.y;

// Temporary image loading
// Going to need to load the entire set of data
// BEFORE running the game's update loop for the first time.
// Will need asset management for that.

let i = new Image();
let img_wal_001 = null;
i.ready = false;
i.crossOrigin = "anonymous";
i.onload = () => {
    i.ready = true;
    // Convert to canvas to image
    let c = document.createElement('canvas');
    c.width = i.width;
    c.height = i.height;
    let c_ctx = c.getContext('2d');
    c_ctx.fillStyle = "black";
    c_ctx.clearRect(0, 0, c.width, c.height);
    c_ctx.drawImage(i, 0, 0);
    img_wal_001 = c_ctx.getImageData(0, 0, c.width, c.height);
    console.dir(img_wal_001);

    update(Date.now());
};
i.src = "/wal_001.png";

// Scale up to window extents if possible
let scale = 1;
if(Game.canvas.width > Game.canvas.height) {
    scale = Math.floor(window.innerWidth / Game.canvas.width)-2;
    Game.canvas.style = `
        width: ${Game.canvas.width*scale}px; 
        position: absolute; 
        left: 50%; 
        top: 50%; 
        transform: translateX(-50%) translateY(-50%);
        image-rendering: optimizeSpeed;
        image-rendering: crisp-edges;
        image-rendering: pixelated;`;
} else {
    scale = Math.floor(window.innerHeight / Game.canvas.height);
    Game.canvas.style = `
        height: ${Game.canvas.height*scale}px; 
        position: absolute; 
        left: 50%; 
        top: 50%; 
        transform: translateX(-50%) translateY(-50%);
        image-rendering: crisp-edges;
        image-rendering: pixelated;`;
}

Game.context = Game.canvas.getContext('2d');
Game.context.imageSmoothingEnabled = false;

Game.context.fillStyle = "#FF00FF";
Game.context.fillRect(0,0,Game.canvas.width, Game.canvas.height);

// ImageData render
let renderBuffer = new Uint8ClampedArray(Game.renderResolution.x * Game.renderResolution.y * 4);

let renderImage = new ImageData(Game.renderResolution.x, Game.renderResolution.y);

for(let i = 0; i < Game.renderResolution.x * Game.renderResolution.y; i+=4) {
    renderImage.data[i] = 0;
    renderImage.data[i+1] = 0;
    renderImage.data[i+2] = 0;
    renderImage.data[i+3] = 255;
}

function CopyBuffer() {
    for(let iy = 0; iy < Game.renderResolution.y; iy++) {
        for(let ix = 0; ix < Game.renderResolution.x; ix++) {
            let idex = (iy * (Game.renderResolution.x * 4) + (ix*4));
            let idex2 = iy * (Game.renderResolution.x*4) + (ix*4);
            let col = renderBuffer[idex];
            //let shiftcol = ShiftTable[col%256] ? ShiftTable[col%256] + col%256 : col%256;
            //let rgbcol = VGAPalette[shiftcol%256];
            renderImage.data[idex2] = renderBuffer[idex];
            renderImage.data[idex2+1] = renderBuffer[idex+1];
            renderImage.data[idex2+2] = renderBuffer[idex+2];
            renderImage.data[idex2+3] = renderBuffer[idex+3];
        }
    }
}

// Generate some colors
for(let i = 0; i < 64; i++) {
    PaletteSet(i, i*4, 0, 0);
    PaletteSet(i+64, 0, i*4, 0);
    PaletteSet(i+128, 0, 0, i*4);
    PaletteSet(i+194, i*4, i*4, i*4);
}

function drawPixel(x, y, r, g, b, a) {
    let idex = (y * (Game.renderResolution.x * 4) + (x * 4));
    if(x < 0 || x > Game.renderResolution.x - 1 || y < 0 || y > Game.renderResolution.y - 1) { return; }
    renderBuffer[idex] = r;
    renderBuffer[idex + 1] = g;
    renderBuffer[idex + 2] = b;
    renderBuffer[idex + 3] = a;
    /*let idex = y * (Game.renderResolution.x*4) + (x*4);
    let shiftcol = ShiftTable[col%256] ? ShiftTable[col%256] + col%256 : col%256;
    let rgbcol = VGAPalette[shiftcol%256];
    renderImage.data[idex] = rgbcol.r;
    renderImage.data[idex+1] = rgbcol.g;
    renderImage.data[idex+2] = rgbcol.b;
    renderImage.data[idex+3] = 255;*/
}

let pix = new Vec2(32, 32);
function clamp256(v) {
    return v % 256;
}
let coloffset = 0;

for(let i = 0; i < 256; i++) {
    ShiftTable[i] = 0;
}

let ptn1 = new Uint8ClampedArray(32*32*4);
for(let iy = 0; iy < 32; iy++) {
    for(let ix = 0; ix < 32; ix++) {
        let idex = iy * (32*4) + (ix * 4);
        ptn1[idex] = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5 + 256) % 256;
        ptn1[idex + 1] = Math.floor(((ix ^ iy) * 1.175 * 1.125) * 0.5 + 128) % 256;
        ptn1[idex + 2] = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5 + 64) % 256;
        ptn1[idex + 3] = 255;

        //myTestPattern[iy*128+(ix*4)] = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5 + 256) % 256;
        //myTestPattern[iy*128+(ix*4) + 1] = Math.floor(((ix ^ iy) * 1.175 * 1.125) * 1.5 + 128) % 256;
        //myTestPattern[iy*128+(ix*4) + 2] = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5 + 64) % 256;
        //myTestPattern[iy*128+(ix*4) + 3] = 255;
    }
}

let ptn2 = new Uint8ClampedArray(32*32*4);
for(let iy = 0; iy < 32; iy++) {
    for(let ix = 0; ix < 32; ix++) {
        let idex = iy * (32*4) + (ix * 4);
        ptn2[idex] = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5 + 16) % 256;
        ptn2[idex + 1] = Math.floor(((ix ^ iy) * 1.175 * 1.125) * 0.5 + 16) % 256;
        ptn2[idex + 2] = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5 + 200) % 256;
        ptn2[idex + 3] = 255;
    }
}

function DistanceFromPoint(sx, sy, ex, ey, radius) {
    let dx = Math.abs(ex-sx);
    let dy = Math.abs(ey-sy);
    let c = (dx*dx)+(dy*dy);
    let r = radius*radius;
    
    if(c <= r) {
        return r - c;
    } else {
        return null;
    }
}

let spheres = [];
for(let i = 0; i < 5; i++) {
    let x = Math.random() * Game.renderResolution.x;
    let y = Math.random() * Game.renderResolution.y;
    let r = (Math.random() * 32) + 32;
    spheres[i] = {
        x, y, r
    };
}

let lastTime = Date.now();
let deltaTime = 0;

let ren = new Renderer(drawPixel, Game.renderResolution.x, Game.renderResolution.y);
ren.wireframe = false;

let m_verts = [
    -1.0, 1.50, -1.0,     1.0, 1.50, -1.0,     1.0, -1.50, -1.0,   -1.0, -1.50, -1.0, // front face
    1.0, 1.50, 1.0,      -1.0, 1.50, 1.0,     -1.0, -1.50, 1.0,     1.0, -1.50, 1.0, // back face
    -1.0, 1.50, 1.0,     -1.0, 1.50, -1.0,    -1.0, -1.50, -1.0,   -1.0, -1.50, 1.0, // left face
    1.0, 1.50, -1.0,      1.0, 1.50, 1.0,      1.0, -1.50, 1.0,     1.0, -1.50, -1.0, // right face
    -1.0, 1.50, 1.0,      1.0, 1.50, 1.0,      1.0, 1.50, -1.0,    -1.0, 1.50, -1.0, // top face
    1.0, -1.50, 1.0,     -1.0, -1.50, 1.0,    -1.0, -1.50, -1.0,    1.0, -1.50, -1.0, // bottom face
];

let m_colors = [
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,
];

let m_texco = [
    0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,
    0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,
    0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,
    0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,
    0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,
    0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,
];

let m_indices = [
    0, 2, 1,  0, 3, 2,  
    4, 6, 5,  4, 7, 6,
    8, 10, 9,  8, 11, 10, 
    12, 14, 13,  12, 15, 14,
    16, 18, 17,  16, 19, 18,
    20, 22, 21,  20, 23, 22
];

let f_indices = [
    16, 18, 17,  16, 19, 18
];

let c_indices = [
    17, 18, 16,  18, 19, 16
];

let myMesh = new Mesh(m_verts, m_colors, m_texco, m_indices);
let mesh_floor = new Mesh(m_verts, m_colors, m_texco, f_indices);
let mesh_ceil = new Mesh(m_verts, m_colors, m_texco, c_indices);

let projection = Mat4.PERSPECTIVE(ToRadians(60.0), Game.renderResolution.x / Game.renderResolution.y, 0.1, 1000.0);
let rotcounter = 0.0;

let img_pattern1 = {
    data: ptn1,
    width: 32,
    height: 32
};

let img_pattern2 = {
    data: ptn2,
    width: 32,
    height: 32
};


let camera = {
    camtransform: Mat4.IDENTITY,
    pos: new Vec4(27, 0, 23, 0),
    rot: new Vec4(0, 0, 0, 0)
};

function draw_wall(x, y, z, tex, cam) {
    let translation = Mat4.TRANSLATE(x, y, z);
    let rotation = Mat4.IDENTITY();
    let transform = Mat4.mul(projection, Mat4.mul(translation, rotation));
    if(cam) { 
        //let n_trans = Mat4.mul(translation, cam.cam_pos);
        //let n_rot = Mat4.mul(rotation, cam.cam_rot);
        transform = Mat4.mul(projection, 
            Mat4.mul(cam.cam_rot,
            Mat4.mul(cam.cam_pos, Mat4.mul(translation, rotation))));
    }

    
    
    ren.draw_mesh(myMesh, transform, tex);
}

function draw_floor(x, y, z, tex, cam) {
    let translation = Mat4.TRANSLATE(x, y, z);
    let rotation = Mat4.IDENTITY();
    let transform = Mat4.mul(projection, Mat4.mul(translation, rotation));
    if(cam) { 
        //let n_trans = Mat4.mul(translation, cam.cam_pos);
        //let n_rot = Mat4.mul(rotation, cam.cam_rot);
        transform = Mat4.mul(projection, 
            Mat4.mul(cam.cam_rot,
            Mat4.mul(cam.cam_pos, Mat4.mul(translation, rotation))));
    }

    ren.draw_mesh(mesh_floor, transform, tex);
}

function draw_ceil(x, y, z, tex, cam) {
    let translation = Mat4.TRANSLATE(x, y, z);
    let rotation = Mat4.IDENTITY();
    let transform = Mat4.mul(projection, translation);
    if(cam) { 
        // let n_trans = Mat4.mul(translation, cam.cam_pos);
        //let n_rot = Mat4.mul(rotation, cam.cam_rot);
        transform = Mat4.mul(projection, 
            Mat4.mul(cam.cam_rot,
            Mat4.mul(cam.cam_pos, Mat4.mul(translation, rotation))));
    }

    ren.draw_mesh(mesh_ceil, transform, tex);
}

const RENDER_DISTANCE = 12;

function update(tick) {
    let currentTime = Date.now();
    deltaTime = (currentTime - lastTime) / 1000;

    // Clear buffer
    for(let i = 0; i < renderBuffer.length; i+=4) {
        renderBuffer[i] = 0;
        renderBuffer[i+1] = 0;
        renderBuffer[i+2] = 0;
        renderBuffer[i+3] = 255;
    }

    // Clear depth buffer
    ren.clear_zbuffer();

    rotcounter += deltaTime * 0.5;


    //let translation = Mat4.TRANSLATE(0.0, 0.0, 2);
    //let rotation = Mat4.ROTATION(0.0, rotcounter, 0.0);
    //let transform = Mat4.mul(projection, Mat4.mul(translation, rotation));
    
    //ren.draw_mesh(myMesh, transform, fakeimg);

    let cam_pos = Mat4.TRANSLATE(camera.pos.x*2, 0, -camera.pos.z*2);
    let cam_rot = Mat4.ROTATION(0, rotcounter, 0);
    let cam = {cam_pos, cam_rot};

    let cam_x = Math.floor(camera.pos.x);
    let cam_y = Math.floor(camera.pos.z);
    let sx = cam_x - RENDER_DISTANCE < 0 ? 0 : cam_x - RENDER_DISTANCE;
    let sy = cam_y - RENDER_DISTANCE < 0 ? 0 : cam_y - RENDER_DISTANCE;
    let ex = cam_x + RENDER_DISTANCE > map_0.width - 1 ? map_0.width - 1 : cam_x + RENDER_DISTANCE;
    let ey = cam_y + RENDER_DISTANCE > map_0.height - 1 ? map_0.height - 1 : cam_y + RENDER_DISTANCE;
    
    for(let iy = sy; iy < ey; iy++) {
        for(let ix = sx; ix < ex; ix++) {
            let idex = iy * map_0.width + ix;
            let t = map_0.layers[0].data[idex];
            if(t === 0) {
                draw_floor(-ix*2, -3, iy*2, img_pattern1, cam);
                draw_ceil(-ix*2, 0, iy*2, img_pattern2, cam);
            } else {
                draw_wall(-ix*2, 0, iy*2, img_wal_001, cam);
            }
        }
    }

    /*
    for(let iy = 0; iy < map_0.height; iy++) {
        for(let ix = 0; ix < map_0.width; ix++) {
            let idex = (iy) * map_0.width + ix;
            let t = map_0.layers[0].data[idex];
            if(t === 0) {
                draw_floor(-ix*2, -3, iy*2, fakeimg, cam);
                draw_ceil(-ix*2, 0, iy*2, fakeimg, cam);
            }
            else {
                draw_wall(-ix*2, 0, iy*2, img_wal_001, cam);
            }
        }
    }
    */

    CopyBuffer();
    Game.context.fillStyle = "black";
    Game.context.fillRect(0, 0, Game.renderResolution.x, Game.renderResolution.y);
    Game.context.putImageData(renderImage, 0, 0);

    lastTime = currentTime;

    requestAnimationFrame(update);
}
