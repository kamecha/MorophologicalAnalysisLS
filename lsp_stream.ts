import { logger } from "./logger.ts";

export class LspDecoderStream extends TransformStream<Uint8Array, string> {
  constructor() {
    super({
      transform: (chunk, controller) => {
        controller.enqueue(new TextDecoder("utf-8").decode(chunk));
      },
    });
  }
}

export class LspEncoderStream extends TransformStream<string, Uint8Array> {
  constructor() {
    super({
      transform: (chunk, controller) => {
        controller.enqueue(new TextEncoder().encode(chunk));
      },
    });
  }
}
