import defaultVertexShaderSource from "../types/defaultVertexSharedSource";
import IGameParams from "../types/IGameParams";
import GLHelper, { DEFAULT_SIZE } from "./GLHelper";

interface IComputeShaderOptions {
    code: string;
    width: number;
    height: number;
    // uniforms: Record<string, number | number[]>;
    params: string[];
}

export class TextureData {
    
    gl: WebGL2RenderingContext;

    textureId: WebGLTexture;
    framebufferId: WebGLFramebuffer | null;
    width: number;
    height: number;

    constructor(gl: WebGL2RenderingContext, opts: { textureId: WebGLTexture, framebufferId: WebGLFramebuffer | null, width: number, height: number}) {
        this.gl = gl;
        this.textureId = opts.textureId;
        this.framebufferId = opts.framebufferId;
        this.width = opts.width;
        this.height = opts.height;
    }

    free() {
        this.gl.deleteTexture(this.textureId);
    }

    extractImageData() {
        const gl = this.gl;
        if (this.framebufferId) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferId);
        } else {
            throw new Error('Not extractable');
        }
        const pixels = new Uint8Array(this.width * this.height * 4);
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return new ImageData(new Uint8ClampedArray(pixels), this.width, this.height);
    }
}

export default class ComputeShader {

    glh: GLHelper;
    name: string;
    fragmentShader: WebGLShader;

    params: string[];
    program: WebGLProgram;

    width: number;
    height: number;

    constructor(glh: GLHelper, name: string, opts: IComputeShaderOptions) {
        this.glh = glh;
        this.name = name;
        const vertexShader = glh.compileShader(defaultVertexShaderSource, glh.gl.VERTEX_SHADER)
        this.fragmentShader = glh.compileShader(opts.code, glh.gl.FRAGMENT_SHADER);
        this.program = createProgram(glh.gl, vertexShader, this.fragmentShader)
        this.params = opts.params;
        this.width = opts.width;
        this.height = opts.height;
    }

    execute(image: TextureData | null, params: IGameParams, uniforms?: Record<string, number | number[]>): TextureData {
        const gl = this.glh.gl;

        for (let param of this.params) {
            if (!uniforms || typeof uniforms[param] === 'undefined') {
                throw new Error(`Lack of param "${param}" for shader "${this.name}"`)
            }
        }

        gl.useProgram(this.program);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        const positionLocation = gl.getAttribLocation(this.program, "a_position");
        const texcoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
    
        // Create a buffer to put three 2d clip space points in
        const positionBuffer = gl.createBuffer()!;
    
        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // Set a rectangle the same size as the image.
        var x1 = 0;
        var y1 = 0;
        var x2 = this.width;
        var y2 = this.height;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
        ]), gl.STATIC_DRAW);
    
        // provide texture coordinates for the rectangle.
        var texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0,
        ]), gl.STATIC_DRAW);
    
        // Create a texture.
        //var texture = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, image.textureId);
    
        // // Set the parameters so we can render any size image.
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
        // // Upload the image into the texture.

        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.data, 0);

        const resolutionLocation = gl.getUniformLocation(this.program, "u_resolution")!;
        const gpSizeLocation = gl.getUniformLocation(this.program, "u_gp_size")!;
        const inputTextureLocation = gl.getUniformLocation(this.program, "u_image")!;
    
        // lookup uniforms
        const uniformsLocations = this.params.reduce((p, c) => {
            p[c] = gl.getUniformLocation(this.program, c)!;
            return p;
        }, {} as Record<string, WebGLUniformLocation>);
        // var resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");
        // var timeLocation = gl.getUniformLocation(this.program, "time");
        // var probabilityLocation = gl.getUniformLocation(this.program, "probability");

        // webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
        // Clear the canvas
        // gl.clearColor(0, 0, 1, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Tell it to use our program (pair of shaders)
    
        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);
    
        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset);
    
        // Turn on the texcoord attribute
        gl.enableVertexAttribArray(texcoordLocation);
    
        // bind the texcoord buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    
        // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            texcoordLocation, size, type, normalize, stride, offset);
    
        // set the resolution
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform2i(gpSizeLocation, params.columns, params.rows);

        for (let uniform of this.params) {
            const value = uniforms![uniform];
            if (typeof value === 'number') {
                gl.uniform1f(uniformsLocations[uniform], value);
            } else
            if (value.length === 1) {
                gl.uniform1f(uniformsLocations[uniform], value[0]);
            } else
            if (value.length === 2) {
                gl.uniform2f(uniformsLocations[uniform], value[0], value[1]);
            } else
            if (value.length === 3) {
                gl.uniform3f(uniformsLocations[uniform], value[0], value[1], value[2]);
            } else
            if (value.length === 4) {
                gl.uniform4f(uniformsLocations[uniform], value[0], value[1], value[2], value[3]);
            }
        }

        // Make a framebuffer
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        // Make a texture
        const outputTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, outputTexture);

        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // Attach the texture to the framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, image ? image.textureId : null);
        gl.uniform1i(inputTextureLocation, gl.TEXTURE0);
    
        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        const start = Date.now();
        gl.drawArrays(primitiveType, offset, count);
        console.log(this.name + ': ' + (Date.now() - start) + 'ms');

        gl.bindTexture(gl.TEXTURE_2D, outputTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return new TextureData(gl, { framebufferId: fb, textureId: outputTexture, width: DEFAULT_SIZE, height: DEFAULT_SIZE });
    }

}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    // create a program.
    var program = gl.createProgram()!;
   
    // attach the shaders.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
   
    // link the program.
    gl.linkProgram(program);
   
    // Check if it linked.
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        // something went wrong with the link
        throw ("program failed to link:" + gl.getProgramInfoLog (program));
    }
   
    return program;
};