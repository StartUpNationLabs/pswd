import * as wasm from './zxcvbn_wasm_bg.wasm';
export * from './zxcvbn_wasm_bg.js';
import { __wbg_set_wasm } from './zxcvbn_wasm_bg.js';
__wbg_set_wasm(wasm);
