import defaultVertexShaderSource from "../types/defaultVertexSharedSource";
import ComputeShader, { TextureData } from "./ComputeShader";

export type ImageProcessing = (image: ImageBitmap) => ImageBitmap;
export type ImagePipeEntry = ComputeShader | ImageProcessing;
export type UniformsMap = Record<string, '1f' | '2f' | '3f' | '4f'>;

// export const DEFAULT_SIZE = 16384;
export const DEFAULT_SIZE = 100;
export const DEFAULT_SCALE = 1;

export default class GLHelper {

    canvas: OffscreenCanvas | HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    vertexShader: WebGLShader;

    constructor(canvas?: HTMLCanvasElement) {
        this.canvas = canvas || new OffscreenCanvas(DEFAULT_SIZE, DEFAULT_SIZE);
        this.gl = this.canvas.getContext('webgl2')!;
        this.vertexShader = this.compileShader(defaultVertexShaderSource, this.gl.VERTEX_SHADER);
    }

    compileShader(source: string, type: any) {
        const gl = this.gl;

        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            // Something went wrong during compilation; get the error
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
        }
        
        return shader;
    }

    scaleUp(oldBuffer: Uint8ClampedArray) {
        const size = (DEFAULT_SIZE * DEFAULT_SCALE) * (DEFAULT_SIZE * DEFAULT_SCALE) * 4;
        const buffer = new Uint8ClampedArray(size);
        for (let x1 = 0; x1 < DEFAULT_SIZE; x1++) {
            for (let y1 = 0; y1 < DEFAULT_SIZE; y1++) {
                for (let x2 = 0; x2 < DEFAULT_SCALE; x2++) {
                    for (let y2 = 0; y2 < DEFAULT_SCALE; y2++) {
                        const x3 = (x1 * DEFAULT_SCALE + x2) * DEFAULT_SCALE * 4;
                        const y3 = (y1 * DEFAULT_SCALE + y2) * 4;
                        buffer[x3 * DEFAULT_SIZE + y3 + 0] = oldBuffer[(x1) * 4 * DEFAULT_SIZE + (y1) * 4 + 0];
                        buffer[x3 * DEFAULT_SIZE + y3 + 1] = oldBuffer[(x1) * 4 * DEFAULT_SIZE + (y1) * 4 + 1];
                        buffer[x3 * DEFAULT_SIZE + y3 + 2] = oldBuffer[(x1) * 4 * DEFAULT_SIZE + (y1) * 4 + 2];
                        buffer[x3 * DEFAULT_SIZE + y3 + 3] = oldBuffer[(x1) * 4 * DEFAULT_SIZE + (y1) * 4 + 3];
                    }
                }
            }
        }
        return buffer;
    }

    createBlankImage() {
        const gl = this.gl;
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        const tempTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tempTexture);

        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        const buffer = new Uint8Array(DEFAULT_SIZE * DEFAULT_SIZE * 4);
        for (let i = 0; i < DEFAULT_SIZE * DEFAULT_SIZE * 4; i += 4) {
            const idx = Math.floor(i / 4);
            const x = idx % DEFAULT_SIZE;
            const y = Math.floor(idx / DEFAULT_SIZE);
            buffer[i] = Math.floor(y / DEFAULT_SIZE * 256);
            buffer[i + 3] = 255;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DEFAULT_SIZE, DEFAULT_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, buffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tempTexture, 0);

        return new TextureData(gl, {
            textureId: tempTexture,
            framebufferId: fb,
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE
        });
    }

    // pipe(input: ImageBitmap, processors: ImagePipeEntry[], uniforms: ) {
    //     let current = input;
    //     for (let entry of processors) {
    //         if (entry instanceof ComputeShader) {
    //             current = entry.execute(current);
    //         } else {
    //             current = entry(current);
    //         }
    //     }
    //     return current;
    // }
}