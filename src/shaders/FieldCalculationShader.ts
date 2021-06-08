import ComputeShader from "./ComputeShader";
import GLHelper, { DEFAULT_SIZE } from "./GLHelper";

const fieldCalculationShaderSource = `#version 300 es
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

float isMine(ivec2 pixelPos) {
    if (pixelPos.x < 0) {
        return 0.0;
    }
    if (pixelPos.y < 0) {
        return 0.0;
    }
    if (pixelPos.x >= u_gp_size.x) {
        return 0.0;
    }
    if (pixelPos.y >= u_gp_size.y) {
        return 0.0;
    }
    vec4 col = texture(u_image, toTexelPos(pixelPos));
    return colorEq(col, vec4(90.0 / 256.0, 0, 0, 1)) ? 1.0 : 0.0;
}

void main() {
    init();

    ivec2 pixelPos = toPixelPos(v_texCoord);
    vec4 val = texture(u_image, toTexelPos(toPixelPos(v_texCoord)));

    if (colorEq(val, vec4(90.0 / 256.0, 0, 0, 1))) {
        color = val;
        return;
    }

    float lt = isMine(pixelPos + ivec2(-1, -1));
    float mt = isMine(pixelPos + ivec2(+0, -1));
    float rt = isMine(pixelPos + ivec2(+1, -1));

    float lm = isMine(pixelPos + ivec2(-1, +0));
    float rm = isMine(pixelPos + ivec2(+1, +0));

    float lb = isMine(pixelPos + ivec2(-1, +1));
    float mb = isMine(pixelPos + ivec2(+0, +1));
    float rb = isMine(pixelPos + ivec2(+1, +1));

    color = vec4((lt + mt + rt + lm + rm + lb + mb + rb) * 10.0 / 256.0, 0, 0, 1); //vec4(l, val.g, val.b, val.a);//vec4(1, 0, 1, 1);
}`

export default class FieldCalculationShader extends ComputeShader {

    constructor(glh: GLHelper) {
        super(glh, 'fieldCalculation', {
            code: fieldCalculationShaderSource,
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
            params: []
        });
    }

}