declare module '@ffmpeg/core/dist/umd/ffmpeg-core.wasm' {
    const content: ArrayBuffer;
    export default content;
}

declare module '@ffmpeg/core/dist/umd/ffmpeg-core.js' {
    const content: string;
    export default content;
}

declare module '@ffmpeg/core' {
    const version: string;
    export { version };
} 