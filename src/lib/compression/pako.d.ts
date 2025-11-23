declare module 'pako' {
  export function gzip(data: Uint8Array | string): Uint8Array;
  export function ungzip(data: Uint8Array): Uint8Array;
  export const version: string;
}
