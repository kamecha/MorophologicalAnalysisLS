import { LspServer } from "./lsp_server.ts";
import { LspDecoderStream, LspEncoderStream } from "./lsp_stream.ts";

function main() {
  const server = new LspServer();
  Deno.stdin.readable
    .pipeThrough(
      new LspDecoderStream(),
    )
    .pipeThrough(
      new TransformStream({
        transform: (chunk, controller) => {
          const response = server.response(chunk);
          controller.enqueue(response);
        },
      }),
    )
    .pipeThrough(
      new LspEncoderStream(),
    )
    .pipeTo(Deno.stdout.writable);
}

main();
