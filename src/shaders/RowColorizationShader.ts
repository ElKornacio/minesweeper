import ComputeShader from "./ComputeShader";
import GLHelper, { DEFAULT_SIZE } from "./GLHelper";

const rowColorizationShaderSource = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform ivec2 u_gp_size;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;
out vec4 color;

vec2 texelSize = vec2(1.0, 1.0);// / u_resolution;
vec2 texelOffset = vec2(0.0, 0.0);// texelSize / 2.0;

void init() {
    texelSize = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);
    texelOffset = texelSize / 2.0;
}

ivec2 toPixelPos(vec2 texelPos) {
    vec2 _texelPos = texelPos - texelOffset;
    return ivec2(floor(_texelPos.x / texelSize.x), floor(_texelPos.y / texelSize.y));
}

vec2 toTexelPos(ivec2 pixelPos) {
    return vec2(float(pixelPos.x) * texelSize.x, float(pixelPos.y) * texelSize.y) + texelOffset;
}

bool colorEq(vec4 a, vec4 b) {
    float eps = 1.0 / 256.0;
    vec4 r = abs(a - b);
    return r.r < eps && r.g < eps && r.b < eps && r.a < eps;
}

void main() {
    init();

    ivec2 pixelPos = toPixelPos(v_texCoord);
    vec4 val = texture(u_image, toTexelPos(toPixelPos(v_texCoord)));

    if (!colorEq(val, vec4(0, 0, 0, 1))) {
        color = val;
        return;
    }

    vec4 prevPixelColor = texture(u_image, toTexelPos(ivec2(pixelPos.x - 1, pixelPos.y)));
    bool isFirst = pixelPos.x == 0 || !colorEq(prevPixelColor, vec4(0, 0, 0, 1));

    if (isFirst) {
        // calculate row length and write it to the first pixel
        int x = pixelPos.x + 1;
        int length = 1;
        while (x < u_gp_size.y) {
            vec4 newVal = texture(u_image, toTexelPos(ivec2(x, pixelPos.y)));
            if (!colorEq(newVal, vec4(0, 0, 0, 1))) {
                break;
            }
            length++;
            x++;
        }
        float lengthHigh = floor(float(length) / 256.0);
        float lengthLow = floor(float(length) - lengthHigh * 256.0);
        color = vec4(0, lengthHigh / 256.0, lengthLow / 256.0, 1);
    } else {
        // propogate first pixel pos as color for all the row (except first pixel)
        int x = pixelPos.x;
        while (x > 0) {
            vec4 newVal = texture(u_image, toTexelPos(ivec2(x, pixelPos.y)));
            if (!colorEq(newVal, vec4(0, 0, 0, 1))) {
                break;
            }
            x--;
        }
        color = vec4(0, float(x + 1) / float(u_gp_size.x + 1), float(pixelPos.y + 1) / float(u_gp_size.y + 1), 1);
    }
}`

export default class RowColorizationShader extends ComputeShader {

    constructor(glh: GLHelper) {
        super(glh, 'rowColorization', {
            code: rowColorizationShaderSource,
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
            params: []
        });
    }

}