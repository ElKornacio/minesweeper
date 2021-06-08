import ComputeShader from "./ComputeShader";
import GLHelper, { DEFAULT_SIZE } from "./GLHelper";

const colorConcatShaderSource = `#version 300 es
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

ivec2 colorToPos(vec4 color) {
    return ivec2(floor(color.g * float(u_gp_size.x + 1) - 1.0), floor(color.b * float(u_gp_size.y + 1) - 1.0))
}

void main() {
    init();

    ivec2 pixelPos = toPixelPos(v_texCoord);
    vec4 val = texture(u_image, toTexelPos(toPixelPos(v_texCoord)));

    if (pixelPos.y == 0) {
        color = col;
        return;
    }

    if (val.r != 0) { // if it's mine or calc - return
        color = val;
        return;
    }

    ivec2 prevLinePixelPos = ivec2(pixelPos.x, pixelPos.y - 1);
    vec4 prevVal = texture(u_image, toTexelPos(prevLinePixelPos));

    if (prevVal.r != 0) { // prev pixel not colored
        color = val;
        return;
    }

    ivec2 valPos = colorToPos(val);
    ivec2 prevValPos = colorToPos(prevVal);

    int x = pixelPos.x;
    while (x > 0) {
        vec4 newVal = texture(u_image, toTexelPos(ivec2(x, pixelPos.y)));
        if (!colorEq(newVal, vec4(0, 0, 0, 1))) {
            break;
        }
        x--;
    }

    color = vec4(0, float(x + 1) / float(u_gp_size.x + 1), float(pixelPos.y + 1) / float(u_gp_size.y + 1), 1);
}`

export default class ColorConcatShader extends ComputeShader {

    constructor(glh: GLHelper) {
        super(glh, 'colorConcat', {
            code: colorConcatShaderSource,
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
            params: []
        });
    }

}