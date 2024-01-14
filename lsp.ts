import { logger } from "./logger.ts";
import * as LSP from "npm:vscode-languageserver-protocol";
import * as LSPTypes from "npm:vscode-languageserver-types";

function main() {
  const decoder = new TextDecoder("utf-8");

  Deno.stdin.readable
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          // logger().info(chunk);
          logger().info(decoder.decode(chunk));
          controller.enqueue(chunk);
        },
      }),
    )
    .pipeTo(Deno.stdout.writable);
}

main();
