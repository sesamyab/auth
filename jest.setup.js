// Polyfill for encoding which isn't present globally in jsdom
import { TextEncoder, TextDecoder } from "util";
import { subtle } from "node:crypto";

// Object.defineProperty(global, 'crypto', {
//     value: { subtle }
// })

global.crypto.subtle = subtle;

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
