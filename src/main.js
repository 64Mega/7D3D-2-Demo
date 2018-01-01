// Game/Engine entry point

import {VGAPalette, ShiftTable, PaletteShiftRight, PaletteSet} from './palette';

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let Game = {
    canvas : null,
    context : null,
    resolution: new Vec2(240, 180),
    renderResolution: new Vec2(240,180)
};

Game.canvas = document.getElementById("RenderCanvas");
Game.canvas.width = Game.resolution.x;
Game.canvas.height = Game.resolution.y;

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
let renderBuffer = new Uint8ClampedArray(Game.renderResolution.x * Game.renderResolution.y);

let renderImage = new ImageData(Game.renderResolution.x, Game.renderResolution.y);

for(let i = 0; i < Game.renderResolution.x * Game.renderResolution.y; i+=4) {
    renderImage.data[i] = 0;
    renderImage.data[i+1] = 0;
    renderImage.data[i+2] = 0;
    renderImage.data[i+3] = 255;
}

// Generate some colors
for(let i = 0; i < 64; i++) {
    PaletteSet(i, i*4, 0, 0);
    PaletteSet(i+64, 0, i*4, 0);
    PaletteSet(i+128, 0, 0, i*4);
    PaletteSet(i+194, i*4, i*4, i*4);
}

function drawPixel(x, y, col) {
    let idex = y * (Game.renderResolution.x*4) + (x*4);
    let shiftcol = ShiftTable[col%256] ? ShiftTable[col%256] + col%256 : col%256;
    let rgbcol = VGAPalette[shiftcol%256];
    renderImage.data[idex] = rgbcol.r;
    renderImage.data[idex+1] = rgbcol.g;
    renderImage.data[idex+2] = rgbcol.b;
    renderImage.data[idex+3] = 255;
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


let holy_nope = 0.0;
let counter = 0;
let cdir = 1;
function update() {
    counter += cdir * 0.001;
    if(counter < 0) {
        counter = 0;
        cdir = 1;
    } else 
    if(counter > 1.0) {
        counter = 1.0;
        cdir = -1;
    }

    holy_nope = Math.sin(counter);
    for(let iy = 0; iy < Game.renderResolution.y; iy++) {
        for(let ix = 0; ix < Game.renderResolution.x; ix++) {
            let col = Math.round((ix + iy)/2);
            let dx = ix * holy_nope * 32;
            let dy = iy * holy_nope * 32;
            col = Math.floor(((dx ^ dy) * 0.875 * 1.125) * 0.5);
            //let idex = (iy%64)*64+(ix%64);
            //col = myTestPattern[idex];
            drawPixel(ix, iy, col % 256);
        }
    }   
    
    for(let i = 0; i < 256; i++) {
        PaletteShiftRight(i, 1, 256);
    }
    

    
    coloffset++;
    coloffset = coloffset % 256;
    pix.x += 1;
    Game.context.putImageData(renderImage, 0, 0);
    requestAnimationFrame(update);
}



update();