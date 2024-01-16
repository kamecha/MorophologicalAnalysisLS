import { LspDecoderStream, LspEncoderStream } from "./lsp_stream.ts";

function main() {
  Deno.stdin.readable
    .pipeThrough(
      new LspDecoderStream(),
    )
    .pipeThrough(
      new LspEncoderStream(),
    )
    .pipeTo(Deno.stdout.writable);
}

main();
