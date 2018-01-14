// Generic input class


export default class Input {
    constructor() {
        this.canvas = document.getElementById("RenderCanvas");
        this.isLocked = false;
        this.canvas.addEventListener('click', (ev) => {
            if(this.isLocked === false) { this.canvas.requestPointerLock(); }
            ev.preventDefault();
        }, false);

        document.addEventListener('pointerlockchange', (ev) => {
            this.isLocked = !this.isLocked;
            //console.log("Cursor Lock changed to " + this.isLocked);
        }, false);

        this.keys = [];
        for(let i = 0; i < 256; i++) {
            this.keys[i] = 0;
        }

        document.addEventListener("keydown", (ev) => {
            this.keys[ev.keyCode] = 1;
            if(this.isLocked) {
                ev.preventDefault();
            }
            //console.log("Pressed " + ev.keyCode);
        });

        document.addEventListener("keyup", (ev) => {
            this.keys[ev.keyCode] = false;
            //console.log("Released " + ev.keyCode);
        });

        this.mouse = {
            delta_x : 0,
            delta_y : 0,
            delta_xf : 0.0, 
            delta_yf : 0.0,
            vel_x : 0.0, 
            vel_y : 0.0,
            button_left: false,
            button_right: false,
            scroll_up: false,
            scroll_down: false,
            button_middle: false,
            last_move_x: 0,
        }

        document.addEventListener("mousemove", (ev) => {
            if(this.isLocked) {
                if(this.mouse.last_move_x > 0 && ev.movementX < 0) {
                    ev.movementX = this.mouse.last_move_x;
                }
                if(this.mouse.last_move_x < 0 && ev.movementX > 0) {
                    ev.movementX = this.mouse.last_move_x;
                }
                this.mouse.delta_x = ev.movementX;
                this.mouse.delta_y = ev.movementY;
                this.mouse.delta_xf = (1 / 320) * ev.movementX;
                this.mouse.delta_yf = (1 / 200) * ev.movementY;                  
            }
        });

        document.addEventListener("mousedown", (ev) => {
            this.mouse.button_left = ev.button_left;
            this.mouse.button_right = ev.button_right;
        });

        document.addEventListener("mouseup", (ev) => {
            this.mouse.button_left = ev.button_left;
            this.mouse.button_right = ev.button_right;
        });

        setInterval(() => {
            this.update();
        }, 1000/60);
    }

    update() {
        if(this.mouse.delta_x > 1) {
            this.mouse.delta_x -= 1;
        } else 
        if(this.mouse_delta_x < -1) {
            this.mouse.delta_x += 1;
        } else {
            this.mouse.delta_x = 0;
        }

        if(this.mouse.delta_y > 0) {
            this.mouse.delta_y -= 1;
        } else {
            this.mouse.delta_y += 1;
        }
        
        this.mouse.delta_xf = (1/320) * this.mouse.delta_x;
        this.mouse.delta_yf = (1/240) * this.mouse.delta_y;

        if(this.mouse.delta_xf > 1.0) { this.mouse.delta_xf = 1.0; }
        if(this.mouse.delta_xf < -1.0) { this.mouse.delta_xf = -1.0; }
        if(this.mouse.delta_yf > 1.0) { this.mouse.delta_yf = 1.0; }
        if(this.mouse.delta_yf < -1.0) { this.mouse.delta_yf = -1.0; }

        this.mouse.vel_x += this.mouse.delta_xf;
        this.mouse.vel_y += this.mouse.delta_yf;
        if(this.mouse.vel_x > 1.0) { this.mouse.vel_x = 1.0; }
        if(this.mouse.vel_x < -1.0) { this.mouse.vel_x = -1.0; }
        if(this.mouse.vel_y > 1.0) { this.mouse.vel_y = 1.0; }
        if(this.mouse.vel_y < -1.0) { this.mouse.vel_y = -1.0; }
        
        this.mouse.vel_x += -Math.sign(this.mouse.vel_x) * 0.1;
        this.mouse.vel_y += -Math.sign(this.mouse.vel_y) * 0.1;
        
        if(Math.abs(this.mouse.vel_x) <= 0.1) { this.mouse.vel_x = 0.0; }
        if(Math.abs(this.mouse.vel_y) <= 0.1) { this.mouse.vel_y = 0.0; }
    }
}