// Game/Engine entry point

import {VGAPalette, ShiftTable, PaletteShiftRight, PaletteSet} from './palette';
import {Vec4, Mat4, ToRadians, ToDegrees} from "./math";
import Vertex from "./vertex";
import Edge from "./edge";
import Renderer from "./render.js";
import Lerp from "./lerper";
import {Mesh} from "./mesh";

import Input from "./input";

//#region Load Maps
const map_1 = require('./maps/map01_01');

//#endregion

//#region Constants and Setup
const RENDER_DISTANCE = 12;
const FOV = 75;

let Game = {
    canvas : null,
    context : null,
    resolution: new Vec4(320, 200),
    renderResolution: new Vec4(320,200),
    cur_map: map_1
};

Game.canvas = document.getElementById("RenderCanvas");
Game.canvas.width = Game.resolution.x;
Game.canvas.height = Game.resolution.y;

// #endregion

// Lists of assets
let Assets = {
    images : {},
    num_images : 0,
    loaded_images: 0
}

// #region Entity code
// Entity list
let Entities = [];
let EntityTypes = {};

function add_entity_type(name, init, update_callback, render_callback, pcollision_callback, parameters) {
    EntityTypes[name] = {
        name,
        init,
        update: update_callback,
        render: render_callback,
        pcollision: pcollision_callback,
        pos: new Vec4(0, 0, 0, 0),
        data: parameters
    };
}

class Entity {
    constructor(init, update, render, pcol, pos, data) {
        this.data = data;
        this.update = update;
        this.render = render;
        this.pcollision = pcol;
        this.pos = pos;

        if(init) { init(this) };
    }
}

function spawn_entity(entity_name, pos, overrides) {
    let ent = EntityTypes[entity_name];
    if(!ent) { 
        console.log("Couldn't find entity '" + entity_name + "'!");
        return; 
    }
    let newdata = Object.assign({}, ent.data, overrides);
    Entities.push(new Entity(ent.init, ent.update, ent.render, ent.pcollision, pos, newdata));
}

// #endregion

// #region Ball Entity
// Ball Entity
add_entity_type("Ball", 
    (self) => {

    },
    () => {},
    (self, cam) => {
        draw_bbsprite(-self.pos.x*2, -0.5, self.pos.z*2, getImage("/testball.png").data, cam);
    },
    (self, player) => {
        player.en += 5;
        self.dead = true;
        spawn_entity("Message", new Vec4(0,0,0,0), {message: "You got a thing. +5 EN"});
    },
    {foo: "This is a test"}
);

// #endregion

// #region Pickups
add_entity_type("Keycard",
    (self) => { // Init
        self.y_offset = 0.0;
        self.counter = 0;
        self.data.keynum = 1;
    },
    (self, delta_time, transform) => { // Update
        self.counter += delta_time * 3;
        self.y_offset = Math.sin(self.counter) * 0.25;
    },
    (self, cam) => { // render
        let keystr = `/keycard${self.data.keynum}.png`;
        
        draw_bbsprite(-self.pos.x*2, -0.5 + self.y_offset, self.pos.z*2, getImage(keystr).data, cam);
    },
    (self, player) => { // player collision
        let keytype = "";
        switch(self.data.keynum) {
            case 1: {
                player.keys.red = true;
                keytype = "red";
            } break;
            case 2: {
                player.keys.blue = true;
                keytype = "blue";
            } break;
            case 3: {
                player.keys.green = true;
                keytype = "green";
            } break;
            case 4: {
                player.keys.yellow = true;
                keytype = "yellow";
            } break;
        }

        let msgstring = `You got the ${keytype} keycard`;
        spawn_entity("Message", new Vec4(0,0,0,0), {
            message: msgstring
        });
        self.dead = true;
    }, {}
);
// #endregion Pickups

// #region Door Entities
add_entity_type("DoorNarrow",
    // Init
    (self) => {
        self.opentimer = 0;
        self.open = false,
        self.kp_open = false,
        self.data.solid = true;
    },
    // Update
    (self, delta_time, transform) => {
        let pvec = camera.pos;
        let mvec = self.pos;
        if(distance_less(mvec, pvec, 1.0)) {
            
            let looking = 1; // hax
            if(looking > 0) {
                if(input.keys["E".charCodeAt(0)]) {
                    if(self.kp_open === false) {
                        if(self.data.locked === 0) {
                            self.open = true;                        
                        } else {
                            let haskey = false;
                            let keyname = "blank";
                            switch(self.data.locked) {
                                case 1: {
                                    haskey = player.keys.red;
                                    keyname = "red";
                                } break;
                                case 2: {
                                    haskey = player.keys.blue;
                                    keyname = "blue";
                                } break;
                                case 3: {
                                    haskey = player.keys.green;
                                    keyname = "green";
                                } break;
                                case 4: {
                                    haskey = player.keys.yellow;
                                    keyname = "yellow";
                                } break;
                            }

                            if(haskey) {
                                self.open = true;                        
                            } else {
                                spawn_entity("Message", new Vec4(0,0,0,0), {
                                    message: `Locked!`
                                });
                            }
                        }

                        self.kp_open = true;
                    }
                } else self.kp_open = false;
            }
        } else {
            if(self.open === true) {
                if(self.opentimer < 4) {
                    self.opentimer += delta_time;                
                } else {
                    self.opentimer = 0;
                    self.open = false;
                }
            }
        }

        if(self.open === true) {
            if(self.data.offset < 0.9) {
                self.data.offset += delta_time*2;
            } else {
                self.data.offset = 0.9;
                self.data.solid = false;
            }
        } else {
            self.data.solid = true;
            if(self.data.offset > 0.0) {
                self.data.offset -= delta_time*2;
            } else {
                self.data.offset = 0.0;
            }
        }
    },

    // Render
    (self, cam) => {
        let horizontal = self.data.horizontal;
        let astr = "/door_static.png";
        if(self.data.locked !== 0) {
            astr = `/door_locked${self.data.locked}.png`;
        }

        if(horizontal === true) {
            self.data.bbox = {w: 1.0, h: 0.5};
            draw_wall(((-self.pos.x)+self.data.offset)*2, 0.0, self.pos.z*2, getImage(astr).data, cam, new Vec4(1.0, 1.0, 0.5, 1.0));
        } else {
            self.data.bbox = {w: 0.20, h: 1.0};
            draw_wall((-self.pos.x)*2, 0.0, (self.pos.z+self.data.offset)*2, getImage(astr).data, cam, new Vec4(0.5, 1.0, 1.0, 1.0));
        }
    },

    // Collision with player, for pickups.
    null,

    { // Props
        solid: false,
        bbox: {w: 0.25, h: 1.0},
        horizontal: false,
        locked: 0,
        offset: 0,
    }
    // It was halfway through implementing doors that I realized my entity system was complete and utter
    // rubbish. TOO LATE NOW! ONWARD!
);
// #endregion

// #region Message Entity
add_entity_type("Message",
    null,
    (self) => {
        if(self.data.timer > 0) { self.data.timer -= 1;}
        else { self.dead = true; }
    },
    (self, cam) => {
        let tlen = Math.floor((self.data.message.length*8) / 2);
        draw_text(160-tlen, 0, self.data.message, FONT_MAIN);
    },
    (self, player) => {},
    {timer: 60, message: "Nothing"}
);

// #endregion

// #region PlayerProjectile Entity
add_entity_type("PlayerProjectile", null, 
    (self, delta_time) => {
        let npos = self.pos.add(new Vec4(self.data.dir.x, self.data.dir.y, self.data.dir.z, 0.0).mul(self.data.speed).mul(delta_time));
        
        if(world_collision_at(npos) === false) {
            self.pos = npos;
        } else {
            self.dead = true;
            
        }
        if(self.pos.x < 0 || self.pos.x > Game.cur_map.width || self.pos.z < 0 || self.pos.z > Game.cur_map.height) {
            self.dead = true;
        }
    },
    (self, cam) => {
        let texframe = getAnimTex(anims["blaster_shot"], 0.5);
        draw_bbsprite(-self.pos.x*2, -0.65, self.pos.z*2, texframe.data, cam);
    },
    (self, player) => {

    },
    {dir: new Vec4(0.0, 0.0, 0.0, 0.0), sprite: "", speed: 2}
);

// #endregion

// #region Image Loading
// Loads and converts input image files into a byte array. Obviously memory inefficient, as you're unpacking compressed
// formats into full R,G,B,A pixel arrays, but it helps when trying to render them without causing migraines.
function loadImages(filenames) {
    Assets.num_images = filenames.length;
    for(let index in filenames) {
        let n_image = new Image();
        n_image.crossOrigin = "anonymous";
        n_image.onload = () => {
            let c = document.createElement('canvas');
            c.width = n_image.width;
            c.height = n_image.height;
            let ctx = c.getContext('2d');
            ctx.drawImage(n_image, 0, 0);
            Assets.images[filenames[index]] = {
                data: ctx.getImageData(0, 0, c.width, c.height),
                width: c.width,
                height: c.height
            };
            onLoadImage();
        };
        n_image.src = filenames[index];
    }
}

function onLoadImage() {
    Assets.loaded_images++;
    if(Assets.loaded_images === Assets.num_images) {
        // Start game.
        game_start();
    }
}
// #endregion

function getImage(image) {
    return Assets.images[image];
}

// Scale up to window extents if possible
let scale = 1;
if(Game.canvas.width > Game.canvas.height) {
    scale = Math.floor((window.innerWidth-32) / Game.canvas.width)-1;
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
    scale = Math.floor((window.innerHeight-32) / Game.canvas.height)-1;
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

Game.context.fillStyle = "#000000";
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
    if(a === 0) { return; }
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

function getPixel(x, y) {
    let idex = (y * (Game.renderResolution.x * 4) + (x * 4));
    return {
        r: renderBuffer[idex],
        g: renderBuffer[idex + 1],
        b: renderBuffer[idex + 2],
        a: renderBuffer[idex + 3]
    }
}

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

let lastTime = Date.now();
let deltaTime = 0;

let ren = new Renderer(drawPixel, Game.renderResolution.x, Game.renderResolution.y, getPixel);
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
    0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, 0.5,
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

let projection = Mat4.PERSPECTIVE(ToRadians(FOV), Game.renderResolution.x / Game.renderResolution.y, 0.1, 1000.0);
let rotcounter = 0.0;

let bbsprite_verts = [
    -0.5, -0.5, 0.0,  0.5, -0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0
];

let bbsprite_cols = [
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0
];

let bbsprite_texcos = [
    0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0
];

let bbsprite_indices = [
    0, 2, 1,  0, 3, 2
];

let mesh_bbsprite = new Mesh(bbsprite_verts, bbsprite_cols, bbsprite_texcos, bbsprite_indices);

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
    pos: new Vec4(24, 0.0, 23, 1),
    rot: new Vec4(0, 0, 0, 1)
};


let player = {
    hp: 100,
    en: 0,
    c_wep: "blaster",
    weps: {
        blaster: [true, -1]
    },
    keys: {
        blue: false,
        green: false,
        red: false, 
        yellow: false
    }
}

function createAnimTex(texName, frames, width, height) {
    let sprites = frames;
    let numframes = frames.length
    let curframe = 0;

    return {
        sprites, width, height, numframes, curframe    
    };
}

function getAnimTex(anitex, anispeed) {
    let fframe = Math.floor(anitex.curframe);
    anitex.curframe += anispeed;
    if(anitex.curframe >= anitex.numframes) { anitex.curframe = 0.0; }
    return anitex.sprites[fframe];
}

// #region Drawing Functions
function draw_wall(x, y, z, tex, cam, scalevec) {
    let scv = scalevec || new Vec4(1.0, 1.0, 1.0, 0.0);
    let translation = Mat4.TRANSLATE(x, y, z);
    let scale = Mat4.SCALE(scv.x, scv.y, scv.z);
    let rotation = Mat4.IDENTITY();
    let transform = Mat4.mul(projection, Mat4.mul(translation, Mat4.mul(rotation, scale)));
    
    if(cam) { 
        //let n_trans = Mat4.mul(translation, cam.cam_pos);
        //let n_rot = Mat4.mul(rotation, cam.cam_rot);
        transform = Mat4.mul(projection, 
            Mat4.mul(cam.cam_rot,
            Mat4.mul(cam.cam_pos, Mat4.mul(translation, Mat4.mul(rotation, scale)))));
    }

    ren.draw_mesh(myMesh, transform, tex, false);
}

function draw_bbsprite(x, y, z, tex, cam, scl) {
    let mscl = scl || new Vec4(1.0, 1.0, 1.0, 1.0);
    let translation = Mat4.TRANSLATE(x, y, z);
    let rotation = Mat4.IDENTITY();
    let scale = Mat4.SCALE(mscl.x, mscl.y, mscl.z);
    let transform = Mat4.mul(projection, Mat4.mul(translation, rotation));

    if(cam) {
        transform = Mat4.mul(projection, Mat4.mul(cam.cam_rot, Mat4.mul(cam.cam_pos, Mat4.mul(translation, rotation))));
    }

    let bbtrans = new Mat4(transform);

    let look = new Vec4(x, y, z, 1.0);
    let pt = new Vec4(x, y, z, 1.0);
    let cpos = new Vec4(cam.cam_pos_vec.x,cam.cam_pos_vec.y,cam.cam_pos_vec.z,1.0);
    look = cpos.sub(pt);
    let up = new Vec4(cam.cam_rot.m[0][1], cam.cam_rot.m[1][1], cam.cam_rot.m[2][1], 1.0);
    let right = (look.cross(up));
    let up2 = (look.cross(right));

    right = right.normalized();
    look = look.normalized();
    up2 = up2.normalized();

    let m = [
        [right.x, up2.x, look.x, x], 
        [right.y, up2.y, look.y, y], 
        [right.z, up2.z, look.z, z], 
        [0.0, 0.0, 0.0, 1.0], 
    ]

    let m2 = [
        [right.x, 0.0, look.x, 0.0], 
        [right.y, 1.0, look.y, 0.0], 
        [right.z, 0.0, look.z, 0.0], 
        [0.0, 0.0, 0.0, 1.0]
    ]

    bbtrans.m = m;

    let rightmat = new Mat4(m2);

    let cbtrans = Mat4.mul(
        projection, 
        Mat4.mul
        (
            cam.cam_rot, 
            Mat4.mul
            ( 
                Mat4.IDENTITY(), 
                Mat4.mul
                (
                    cam.cam_pos,
                    Mat4.mul(
                        bbtrans,
                        Mat4.mul(
                            cam.cam_rot,
                            Mat4.mul(rightmat, scale)
                        )
                    )
                )
            )
        )
    );

    
    //transform = Mat4.mul(transform, bbtrans);

    transform.m[0][1] = up2.x;
    transform.m[1][1] = up2.y;
    transform.m[2][1] = up2.z;

    transform.m[0][0] = right.x;
    transform.m[1][0] = right.y;
    transform.m[2][0] = right.z;

    ren.draw_mesh(mesh_bbsprite, cbtrans, tex, true);
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

function draw_sprite_part(spr, srcx, srcy, srcw, srch, dstx, dsty) {
    for(let iy = 0; iy < srch; iy++) {
        for(let ix = 0; ix < srcw; ix++) {
            let texidex = ((iy + srcy) * (spr.width * 4) + ((ix + srcx) * 4));
            drawPixel(dstx + ix, dsty + iy, spr.data.data[texidex], spr.data.data[texidex + 1], spr.data.data[texidex + 2], spr.data.data[texidex + 3])
        }
    }
}

function draw_sprite(spr, x, y, w, h) {    
    for(let iy = 0; iy < h; iy++) {
        for(let ix = 0; ix < w; ix++) {
            let texidex = (iy * (spr.width * 4) + (ix * 4));
            drawPixel(x+ix, y+iy, spr.data.data[texidex], spr.data.data[texidex + 1], spr.data.data[texidex + 2], spr.data.data[texidex+3]);
        }
    }
}

// #endregion

const FONT_MINI = {
    file: "/spr_font1.png",
    gwidth: 5,
    gheight: 8,
};

const FONT_MAIN = {
    file: "/font_main.png",
    gwidth: 8,
    gheight: 8
}

function draw_text(x, y, text, font) {
    for(let c = 0; c < text.length; c++) { // See? My code has some c++ in it, for robustness.
        let glyph = text.charCodeAt(c) - 32;
        draw_sprite_part(getImage(font.file), (glyph*font.gwidth), 0, font.gwidth, font.gheight, x + (c * font.gwidth), y);
    }   
}


//#region image loading
// Load some images
loadImages([
    "/wal_001.png",
    "/hud_bg.png",
    "/crosshair.png",
    "/testball.png",
    "/spr_font1.png",
    "/font_main.png",
    "/wal_0.png",
    "/wal_1.png",
    "/wal_2.png",
    "/wal_3.png",
    "/wal_4.png",
    "/wal_5.png",
    "/wal_6.png",
    "/wal_7.png",
    "/wal_8.png",
    "/bg_city.png",
    "/gun_1.png",
    "/blaster_shot_static.png",
    "/blast_shot_anim.png",
    "/door_static.png",
    "/door_locked1.png",
    "/door_locked2.png",
    "/door_locked3.png",
    "/door_locked4.png",
    "/keycard_icon1.png",
    "/keycard_icon2.png",
    "/keycard_icon3.png",
    "/keycard_icon4.png",
    "/keycard1.png",
    "/keycard2.png",
    "/keycard3.png",
    "/keycard4.png",

    // Animation: Blaster shot
    "/anims/blaster_shot/1.png",
    "/anims/blaster_shot/2.png",
    "/anims/blaster_shot/3.png",
]);
//#endregion

//#region anim_definitions
const anims = {};
function load_anims() {
    anims["blaster_shot"] = createAnimTex("", [
        getImage("/anims/blaster_shot/1.png"),
        getImage("/anims/blaster_shot/2.png"),
        getImage("/anims/blaster_shot/3.png")
    ]);
}
//#endregion

function getWalTexture(num) {
    return getImage(`/wal_${num}.png`);
}

function move_camera(cam, movestrength) {
    let newpos = new Vec4(0, 0, 0, 0);
    let rot = cam.rot.y;

    newpos.x = Math.sin(rot) * movestrength;
    newpos.z = Math.cos(rot) * -movestrength;
    newpos.y = cam.pos.y;
    return newpos;
}

//#region collision
function aabb_collision(a, b) {
    return !(
        a.x + a.w < b.x || a.x > b.x + b.w ||
        a.y + a.h < b.y || a.y > b.y + b.h
    );
}

function radius_collision(a, b, radius) {
    let v = new Vec4(b.x - a.x, b.y - a.y, b.z - a.z, 1.0);
    let dists = (v.x*v.x)+(v.y*v.y)+(v.z*v.z);
    let rr = radius*radius;
    return dists <= radius;
}

function point_in_bbox(point, bbox) {
    return (point.x >= bbox.left && point.x <= bbox.right && point.z >= bbox.back && point.z <= bbox.front);
}

function world_collision_at(pos) {
    let cmap = Game.cur_map;
    let px = Math.floor(pos.x + 0.5);
    let py = Math.floor(pos.z + 0.5);

    if(px < 0 || px > cmap.width - 1 || py < 0 || py > cmap.height - 1) { return false; }
    let id = (py * cmap.width + px);
    let ecol = false;

    for(let i = 0; i < Entities.length; i++) {
        if(!Entities[i].data.solid === true) { continue; }
        let entbox = {
            x: Entities[i].pos.x - (Entities[i].data.bbox.w/2),
            y: Entities[i].pos.z - (Entities[i].data.bbox.h/2),
            w: Entities[i].data.bbox.w,
            h: Entities[i].data.bbox.h
        }
        let plbox = {
            x: pos.x - 0.25,
            y: pos.z - 0.25,
            w: 0.5,
            h: 0.5
        }
        ecol = aabb_collision(entbox, plbox); 
        if(ecol === true) { break; }
    }
    return cmap.layers[1].data[id] !== 0 || ecol;
}

function distance_less(point_a, point_b, dist) {
    let c = point_a.sub(point_b);
    let dst = (c.x*c.x)+(c.z*c.z);
    return dst <= (dist*dist);
}

//#endregion

// -- Input init

let input = new Input();

// Map loader. Actually a map changer/spawner.
function load_map(map) {
    Game.cur_map = map;
    let objects = map.layers[3].objects;
    for(let i = 0; i < objects.length; i++) {
        let posx = Math.floor(objects[i].x / 16);
        let posy = Math.floor(objects[i].y / 16);
        if(objects[i].type === "PlayerStart") {
            camera.pos.x = Math.floor(objects[i].x / 16);
            camera.pos.z = Math.floor(objects[i].y / 16);
            camera.rot.y = ToRadians(objects[i].properties.start_rotation);
        }
        if(objects[i].type === "Ball") {
            console.log("Spawning Ball");
            spawn_entity("Ball", new Vec4(posx, 0.0, posy, 1.0), {});
        }
        if(objects[i].type === "Key") {
            console.log("Spawning keycard");
            spawn_entity("Keycard", new Vec4(posx, 0.0, posy, 1.0), {
                keynum : objects[i].properties ? objects[i].properties.keynum || 1 : 1
            });
        }
        if(objects[i].type === "DoorNarrow") {
            console.log("Spawning Door");
            let horizontal = objects[i].properties ? objects[i].properties.horizontal || false : false;
            let locked = objects[i].properties ? objects[i].properties.locked || 0 : 0;
            spawn_entity("DoorNarrow", new Vec4(posx, 0.0, posy, 1.0), {
                horizontal,
                locked
            })
        }
    }
}

let movebob_counter = 0.0;
let kp_shoot = false;

function game_start() {
    load_map(map_1);
    load_anims();
    update(Date.now());
}

//#region update
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

    camera.rot.y += (input.keys[39] - input.keys[37]) * 3 * deltaTime;
    //camera.rot.y += input.mouse.delta_xf;

    let movdelta = (input.keys[40] - input.keys[38]) * deltaTime;
    let strafedelta = (input.keys[68] - input.keys[65]) * deltaTime;

    // Movement Code
    if(movdelta !== 0) {
        let np = move_camera(camera, movdelta * 4);
        let pad_x = Math.sign(np.x) * 0.1;
        let pad_z = Math.sign(np.z) * 0.1;
        movebob_counter += deltaTime * 15;

        if(world_collision_at(camera.pos.add(np.add(new Vec4(pad_x, 0.0, pad_z, 0.0)))) === false) {
            camera.pos.x += np.x;
            camera.pos.z += np.z;
        } else {
            let zx = new Vec4(camera.pos.x + np.x + pad_x, camera.pos.y, camera.pos.z, camera.pos.w);
            let zz = new Vec4(camera.pos.x, camera.pos.y, camera.pos.z + np.z + pad_z, camera.pos.w);
            if(world_collision_at(zx) === false) {
                camera.pos.x += np.x;
            } else 
            if(world_collision_at(zz) === false) {
                camera.pos.z += np.z;
            }
        }
    } else {
        movebob_counter = 0;
    }

    // Draw static background
    let bg_xoffset = Math.floor(((ToDegrees(camera.rot.y) % 360) * (1 / 360)) * 1280) % 960;
    
    draw_sprite_part(getImage("/bg_city.png"), bg_xoffset, 0, 320, 200, 0, 0);

    // Draw map

    let cam_pos = Mat4.TRANSLATE(camera.pos.x*2, 0.0, -camera.pos.z*2);
    let cam_rot = Mat4.ROTATION(0, camera.rot.y, 0);
    let cam = {cam_pos, cam_rot, cam_pos_vec: camera.pos};

    let cam_x = Math.floor(camera.pos.x);
    let cam_y = Math.floor(camera.pos.z);
    let sx = cam_x - RENDER_DISTANCE < 0 ? 0 : cam_x - RENDER_DISTANCE;
    let sy = cam_y - RENDER_DISTANCE < 0 ? 0 : cam_y - RENDER_DISTANCE;
    let ex = cam_x + RENDER_DISTANCE > Game.cur_map.width - 1 ? Game.cur_map.width - 1 : cam_x + RENDER_DISTANCE;
    let ey = cam_y + RENDER_DISTANCE > Game.cur_map.height - 1 ? Game.cur_map.height - 1 : cam_y + RENDER_DISTANCE;

    for(let iy = sy; iy < ey; iy++) {
        for(let ix = sx; ix < ex; ix++) {
            let idex = iy * Game.cur_map.width + ix;
            let twal = Game.cur_map.layers[1].data[idex];
            let tfloor = Game.cur_map.layers[0].data[idex];
            let tceil = Game.cur_map.layers[2].data[idex];
            if(twal !== 0) {
                draw_wall(-ix*2, 0, iy*2, getWalTexture(twal-1).data, cam);                
            }
            if(tceil !== 0) {
                draw_ceil(-ix*2, 0.0, iy*2, getWalTexture(tceil-1).data, cam);
            }
            if(tfloor !== 0) {
                draw_floor(-ix*2, -3.0, iy*2, getWalTexture(tfloor-1).data, cam);
            }
        }
    }

    // Shooting
    if(input.keys[" ".charCodeAt(0)] === 1) {
        if(kp_shoot === false) {
            spawn_entity("PlayerProjectile", camera.pos, {
                dir: new Vec4(cam.cam_rot.m[0][2], cam.cam_rot.m[1][2], cam.cam_rot.m[2][2], 1.0),
                sprite: getImage("/blaster_shot_static.png").data,
                speed: 8.0
            });
            kp_shoot = true;
        }
    } else { kp_shoot = false; }

    // Generate transform for entity checks
    let translation = Mat4.TRANSLATE(0, 0, 0);
    let rotation = Mat4.IDENTITY();
    let transform = Mat4.mul(projection, Mat4.mul(translation, rotation));
    
    if(cam) { 
        transform = Mat4.mul(projection, 
            Mat4.mul(cam.cam_rot,
            Mat4.mul(cam.cam_pos, Mat4.mul(translation, rotation))));
    }

    /// Update entities
    for(let i = 0; i < Entities.length; i++) {
        if(Entities[i].dead) {
            Entities.splice(i, 1);
            continue;
        }

        if(Entities[i].update) {
            Entities[i].update(Entities[i], deltaTime, transform);
        }
        if(Entities[i].render) {
            Entities[i].render(Entities[i], cam);
        }
        if(Entities[i].pcollision) {
            if(radius_collision(camera.pos, Entities[i].pos, 0.5)) {
                Entities[i].pcollision(Entities[i], player);
            }
        }
    }

    // Draw VWEP
    let gunbob = Math.floor(Math.sin(movebob_counter) * 4);
    draw_sprite(getImage("/gun_1.png"), 160-(Math.floor(gunbob/2)), 110+gunbob, 64, 75);

    // Draw HUD
    draw_sprite(getImage("/hud_bg.png"), 0, 168, 320, 32);
    draw_sprite(getImage("/crosshair.png"), 152, 96, 16, 16);

    // Drawing some text
    draw_text(4,188,player.hp.toString(), FONT_MAIN);
    let enstring = player.en.toString();
    if(enstring.length === 1) { enstring = "  " + enstring; }
    else if(enstring.length === 2) { enstring = " " + enstring; } // I'm lazy 
    draw_text(36,188,enstring, FONT_MAIN);

    let wepdata = player.weps[player.c_wep];
    let ammostr = wepdata[1];
    if(wepdata[1] === -1) {
        ammostr = "INFINITE";
    }

    draw_text(64, 188, ammostr, FONT_MAIN);

    // Drawing keycards
    player.keys.red && draw_sprite(getImage("/keycard_icon1.png"), 297, 177, 8, 8);
    player.keys.blue && draw_sprite(getImage("/keycard_icon2.png"), 306, 177, 8, 8);
    player.keys.green && draw_sprite(getImage("/keycard_icon3.png"), 297, 186, 8, 8);
    player.keys.yellow && draw_sprite(getImage("/keycard_icon4.png"), 306, 186, 8, 8);

    CopyBuffer();
    Game.context.fillStyle = "black";
    Game.context.fillRect(0, 0, Game.renderResolution.x, Game.renderResolution.y);
    Game.context.putImageData(renderImage, 0, 0);

    lastTime = currentTime;

    requestAnimationFrame(update);
}
//#endregion