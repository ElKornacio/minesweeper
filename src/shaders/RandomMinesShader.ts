import IGameParams from "../types/IGameParams";
import ComputeShader from "./ComputeShader";
import GLHelper, { DEFAULT_SIZE } from "./GLHelper";

const randomFragmentShader = `#version 300 es
precision highp float;
precision highp int;

uniform float time;
uniform float probability;

uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}

// Compound versions of the hashing algorithm I whipped together.
uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }

// Construct a float with half-open range [0:1] using low 23 bits.
// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
float floatConstruct( uint m ) {
    const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
    const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32

    m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
    m |= ieeeOne;                          // Add fractional part to 1.0

    float  f = uintBitsToFloat( m );       // Range [1:2]
    return f - 1.0;                        // Range [0:1]
}

// Pseudo-random value in half-open range [0:1].
float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }




// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;
out vec4 color;

void main() {
    vec2 st = v_texCoord.xy / time;
    st.x = random(st);

    if (random(st) < probability) {
        color = vec4(90.0 / 256.0, 0, 0, 1);
    } else {
        color = vec4(0, 0, 0, 1);
    }
}`

export default class RandomMinesShader extends ComputeShader {

    constructor(glh: GLHelper) {
        super(glh, 'randomMines', {
            code: randomFragmentShader,
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
            params: ['time', 'probability']
        });
    }

}