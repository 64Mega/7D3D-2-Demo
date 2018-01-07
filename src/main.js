// Game/Engine entry point

import {VGAPalette, ShiftTable, PaletteShiftRight, PaletteSet} from './palette';
import {Vec4, Mat4, ToRadians} from "./math";
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

class G_Stars3D  {
    constructor(numstars, spread, speed) {
        this.numstars = numstars;
        this.spread = spread;
        this.speed = speed;
        this.stardata = [];
        for(let i = 0; i < numstars; i++) {
            this.initStar(i);
        }
        
        this.projection = Mat4.PERSPECTIVE(ToRadians(60.0), Game.renderResolution.x / Game.renderResolution.y, 0.1, 1000.0);
    }

    initStar(index) {
        this.stardata[index] = new Vec4(
            2 * (Math.random() - 0.5) * this.spread,
            2 * (Math.random() - 0.5) * this.spread,
            (Math.random() - 0.00001) * this.spread,
            1.0
        );
    }

    render(delta, drawpixel) {
        
        for(let i = 0; i < this.stardata.length; i++) {
            this.stardata[i].z -= this.speed * delta;

            if(this.stardata[i].z <= 0) {
                this.initStar(i);
            }

            let hw = Game.renderResolution.x / 2;
            let hh = Game.renderResolution.y / 2;
            //let x = Math.floor((this.stardata[i].x / this.stardata[i].z) * hw + hw);
            //let y = Math.floor((this.stardata[i].y / this.stardata[i].z) * hh + hh);
            let tv = this.projection.transform(this.stardata[i]);
            let x = Math.ceil(tv.x);
            let y = Math.ceil(tv.y);
            let screen = Mat4.SCREEN_SPACE_TRANSFORM(Game.renderResolution.width, Game.renderResolution.height);
            let v = new Vec4(this.stardata[i].x, this.stardata[i].z, this.stardata[i].z, this.stardata[i].z);
            v = screen.transform(new Vec4(v.x / v.w, v.y / v.w, v.z / v.w, v.w));

            if(x < 0 || x > Game.renderResolution.x-1 || y < 0 || y > Game.renderResolution.y-1) {
                this.initStar(i);
            } else {
                let dist = Math.floor((100.0) * this.stardata[i].z) % 64;
                
                drawpixel(v.x, v.y, 192+(64-dist));
            }
        }
    }
}

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

function CopyBuffer() {
    for(let iy = 0; iy < Game.renderResolution.y; iy++) {
        for(let ix = 0; ix < Game.renderResolution.x; ix++) {
            let idex = iy * (Game.renderResolution.x) + ix;
            let idex2 = iy * (Game.renderResolution.x*4) + (ix*4);
            let col = renderBuffer[idex];
            let shiftcol = ShiftTable[col%256] ? ShiftTable[col%256] + col%256 : col%256;
            let rgbcol = VGAPalette[shiftcol%256];
            renderImage.data[idex2] = rgbcol.r;
            renderImage.data[idex2+1] = rgbcol.g;
            renderImage.data[idex2+2] = rgbcol.b;
            renderImage.data[idex2+3] = 255;
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

function drawPixel(x, y, col) {
    renderBuffer[y * Game.renderResolution.x + x] = col;
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

let myStarField = new G_Stars3D(256, 64.0, 20.0);



function update(tick) {
    let currentTime = Date.now();
    deltaTime = (currentTime - lastTime) / 1000;

    // Clear buffer
    for(let i = 0; i < renderBuffer.length; i++) {
        renderBuffer[i] = 0;
    }

    /*
    for(let iy = 0; iy < Game.renderResolution.y; iy++) {
        for(let ix = 0; ix < Game.renderResolution.x; ix++) {
            let col = Math.round((ix + iy)/2);
            col = Math.floor(((ix ^ iy) * 0.875 * 1.125) * 0.5);
            //let idex = (iy%64)*64+(ix%64);
            //col = myTestPattern[idex];
            drawPixel(ix, iy, col % 256);
        }
    }   
    
    for(let i = 0; i < 256; i++) {
        PaletteShiftRight(i, 1, 256);
    }*/
    
    myStarField.render(deltaTime, drawPixel);
    
    coloffset++;
    coloffset = coloffset % 256;
    pix.x += 1;
    CopyBuffer();
    Game.context.putImageData(renderImage, 0, 0);

    lastTime = currentTime;

    requestAnimationFrame(update);
}



update(Date.now());