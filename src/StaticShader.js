let StaticShader = {
  uniforms: {
    tDiffuse: {value: null},
    resolution: {value: null},
    pixelSize: {value: 1},
  },

  vertexShader: [
    'void main() {',

    'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

    '}',
  ].join('\n'),

  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float pixelSize;',
    'uniform float time;',
    'uniform vec2 resolution;',

    'float rand(vec2 co){',
    '    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);',
    '}',

    'void main(){',

    'vec2 dxy = 2.0 / resolution;',
    'vec2 position = ( gl_FragCoord.xy / resolution.xy );',
    'vec2 coord = dxy * floor( position / dxy );',
    'vec4 color = texture2D(tDiffuse, coord);',
    'color = texture2D(tDiffuse, coord);',
    'float noise = rand(vec2(time*coord.x, time*coord.y)) - 0.7;',
    'color += noise;',
    'gl_FragColor = color;',

    '}',
  ].join('\n'),
};

export default StaticShader;
