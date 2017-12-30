// Game/Engine entry point

import {VGAPalette, ShiftTable, PaletteShiftRight} from './palette';

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
    scale = Math.floor(window.innerWidth / Game.canvas.width);
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

function update() {
    for(let iy = 0; iy < Game.renderResolution.y; iy++) {
        for(let ix = 0; ix < Game.renderResolution.x; ix++) {
            drawPixel(ix, iy, coloffset+ix+iy);
        }
    }

    for(let i = 64; i < 128; i++) {
        PaletteShiftRight(i, 1, 256);
        
    }
    coloffset++;
    coloffset = coloffset % 256;
    pix.x += 1;
    Game.context.putImageData(renderImage, 0, 0);
    requestAnimationFrame(update);
}



update();