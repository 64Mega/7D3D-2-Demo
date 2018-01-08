// Game/Engine entry point

import {VGAPalette, ShiftTable, PaletteShiftRight, PaletteSet} from './palette';
import {Vec4, Mat4, ToRadians} from "./math";
import Vertex from "./vertex";
import Edge from "./edge";
import Renderer from "./render.js";
import Lerp from "./lerper";

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

let myTestPattern = new Uint8ClampedArray(64*64);
for(let iy = 0; iy < 64; iy++) {
    for(let ix = 0; ix < 64; ix++) {
        myTestPattern[iy*64+ix] = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5 + 256) % 64;
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
let verts = [
    new Vertex().set(new Vec4(0.0, 1.0, 0.0, 1.0), new Vec4(1.0, 1.0, 1.0, 1.0), new Vec4(0.5, 0.0, 0.0, 0.0)),
    new Vertex().set(new Vec4(-1.0, -1.0, 0.0, 1.0), new Vec4(1.0, 1.0,1.0, 1.0), new Vec4(0.0, 1.0, 0.0, 0.0)),
    new Vertex().set(new Vec4(1.0, -1.0, 0.0, 1.0), new Vec4(1.0, 1.0, 1.0, 1.0), new Vec4(1.0, 1.0, 0.0, 0.0)),
    new Vertex().set(new Vec4(1.0, 1.0, 0.0, 1.0), new Vec4(1.0, 1.0, 1.0, 1.0), new Vec4(1.0, 0.0, 0.0, 0.0)),
    new Vertex().set(new Vec4(-1.0, 1.0, 0.0, 1.0), new Vec4(1.0, 1.0, 1.0, 1.0), new Vec4(0.0, 0.0, 0.0, 0.0))
];

let projection = Mat4.PERSPECTIVE(ToRadians(70.0), Game.renderResolution.x / Game.renderResolution.y, 0.1, 1000.0);
let rotcounter = 0.0;

function update(tick) {
    let currentTime = Date.now();
    deltaTime = (currentTime - lastTime) / 1000;

    // Clear buffer
    for(let i = 0; i < renderBuffer.length; i++) {
        renderBuffer[i] = 0;
    }

    rotcounter += deltaTime;


    let translation = Mat4.TRANSLATE(0.0, 0.0, 3.0 + (0.1 * Math.sin(rotcounter)));
    let rotation = Mat4.ROTATION(0.0, rotcounter, 0.0);
    let transform = Mat4.mul(projection, Mat4.mul(translation, rotation));
    
    ren.fill_tri(verts[0].transform(transform), verts[1].transform(transform), verts[2].transform(transform), img_wal_001);
    ren.fill_tri(verts[0].transform(transform), verts[2].transform(transform), verts[3].transform(transform), img_wal_001);
    ren.fill_tri(verts[0].transform(transform), verts[1].transform(transform), verts[4].transform(transform), img_wal_001);

    CopyBuffer();
    Game.context.putImageData(renderImage, 0, 0);

    lastTime = currentTime;

    requestAnimationFrame(update);
}
