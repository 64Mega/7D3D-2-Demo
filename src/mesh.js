// Mesh Object

import Vertex from "./vertex";
import {Vec4} from "./math";

export class Mesh {
    constructor(vertArray, colArray, texArray, indexArray) {
        this.vertices = [];

        for(let i = 0; i < vertArray.length; i+=3) {
            this.vertices.push(
                new Vertex().set(
                    new Vec4(vertArray[i], vertArray[i + 1], vertArray[i + 2], 1.0),
                    new Vec4(colArray[i], colArray[i+1], colArray[i+2], 1.0),
                    new Vec4(texArray[i], texArray[i+1], 0.0, 1.0)
                )
            );
        }
        
        this.indices = indexArray;
    }
}