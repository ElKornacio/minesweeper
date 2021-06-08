import { TextureData } from '../shaders/ComputeShader';
import FieldCalculationShader from '../shaders/FieldCalculationShader';
import GLHelper, { DEFAULT_SCALE, DEFAULT_SIZE, ImagePipeEntry } from '../shaders/GLHelper';
import RandomMinesShader from '../shaders/RandomMinesShader';
import RowColorizationShader from '../shaders/RowColorizationShader';
import IGameParams from '../types/IGameParams';

export function prepareField() {
    
}

const delay = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

export default async function generateTest() {
    const canvas = document.getElementById('canvas')! as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const params: IGameParams = { columns: DEFAULT_SIZE, rows: DEFAULT_SIZE, mines: 0 };
    const glHelper = new GLHelper();
    // const initial = glHelper.createBlankImage();

    const randomMines = new RandomMinesShader(glHelper);
    const fieldCalculation = new FieldCalculationShader(glHelper);
    const rowColorization = new RowColorizationShader(glHelper);

    const write = async (name: string, i: TextureData) => {
        ctx.clearRect(0, 0, DEFAULT_SIZE * DEFAULT_SCALE, DEFAULT_SIZE * DEFAULT_SCALE);
        const t = i.extractImageData();
        console.log(name + ': ', t.data);
        const b = glHelper.scaleUp(t.data);
        const tt = new ImageData(b, i.width * DEFAULT_SCALE, i.height * DEFAULT_SCALE);
        ctx.putImageData(tt, 0, 0);
        await delay(1000);
    }

    console.log('start');
    
    const pipeStart = Date.now();

    // await write('initial', initial);

    const fieldWithMines = randomMines.execute(null, params, {
        time: Math.random(),
        probability: params.mines / (params.columns * params.rows),
    });
    await write('fieldWithMines', fieldWithMines);

    const calculatedField = fieldCalculation.execute(fieldWithMines, params);
    await write('calculatedField', calculatedField);

    const rowColorizedField = rowColorization.execute(calculatedField, params);
    await write('rowColorizedField', rowColorizedField);
    
    // console.log('reading');
    // const tempBuffer = rowColorizedField.extractImageData().data;
    // // color: { r: number, g: number, b: number, a: number },
    // console.log('calcing');
    // const lines = new Array<{ shortColor: number, start: number, end: number }[]>(params.rows).fill([]);
    // const colorsEquals: Record<string, string> = {};
    // for (let y = 0; y < params.rows; y++) {
    //     let x = 0;
    //     while (x < params.columns) {
    //         if (tempBuffer[(y * params.rows + x) * 4] === 0) {
    //             const lengthHigh = tempBuffer[(y * params.rows + x) * 4 + 1];
    //             const lengthLow = tempBuffer[(y * params.rows + x) * 4 + 2];
    //             const length = lengthHigh * 256 + lengthLow;
    //             console.log(y, lines[y].length, length);
    //             lines[y].push({
    //                 // color: {
    //                 //     r: 0,
    //                 //     g: (x + 1) / (params.columns + 1),
    //                 //     b: (y + 1) / (params.rows + 1),
    //                 //     a: 1,
    //                 // },
    //                 shortColor: x * params.columns + y,
    //                 start: x,
    //                 end: x + length,
    //             });
    //             x += length;
    //         } else {
    //             x++;
    //         }
    //     }
    // }


    await delay(20000);

    const result = rowColorizedField;

    console.log('pipe time: ', (Date.now() - pipeStart) + 'ms');

    // ctx.putImageData(result.extractImageData(), 0, 0);
}

// export default async function generateTest() {
//     const params: IGameParams = {
//         columns: 10000,
//         rows: 10000,
//         mines: 99999999
//     };
//     console.log('a');
//     const start = Date.now();
//     glHelper.generateTexture(program, image, params.mines / (params.columns * params.rows));
//     console.log('b: ' + (Date.now() - start) + 'ms');
// }