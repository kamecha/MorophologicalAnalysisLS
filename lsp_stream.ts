import { logger } from "./logger.ts";
import * as LSP from "npm:vscode-languageserver-protocol";

type LSPHeader = {
  length: number;
  type?: string; // now only support utf-8
};

export class LspDecoderStream extends TransformStream<
  Uint8Array,
  LSP.RequestMessage | LSP.NotificationMessage
> {
  #buffer = new Uint8Array();
  #header: LSPHeader = {
    length: 0,
  };
  #headerFindFlag = false;
  // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#headerPart
  #headerDecoder = new TextDecoder("ascii");
  #contentDecoder = new TextDecoder("utf-8");
  constructor() {
    super({
      transform: (chunk, controller) => {
        this.#buffer = new Uint8Array([...this.#buffer, ...chunk]);
        if (!this.#headerFindFlag) {
          // Content-Length:20\r\n
          // Content-Type:application/vscode-jsonrpc; charset=utf-8\r\n ← これは任意
          // \r\n
          // ↑をheaderとして探す
          const headerStr = this.#headerDecoder.decode(this.#buffer);
          const headerReg =
            /Content-Length: (\d+)\r\n(Content-Type: .*\r\n)?\r\n/;
          const headerMatch = headerStr.match(headerReg);
          if (headerMatch === null) {
            // ここでエラー投げるのもあり
            return;
          }
          this.#header.length = Number(headerMatch[1]);
          this.#headerFindFlag = true;
          // #bufferをheaderの分だけ削除
          this.#buffer = this.#buffer.slice(headerMatch[0].length);
        }
        if (this.#headerFindFlag) {
          if (this.#buffer.length >= this.#header.length) {
            const content = this.#contentDecoder.decode(
              this.#buffer.slice(0, this.#header.length),
            );
            // contentをLSP.RequestMessage | LSP.NotificationMessageに変換
            const contentObj = JSON.parse(content);
            if (contentObj.id === undefined) {
              controller.enqueue(contentObj as LSP.NotificationMessage);
            } else {
              controller.enqueue(contentObj as LSP.RequestMessage);
            }
            // controller.enqueue(content);
            // #bufferをcontentの分だけ削除
            this.#buffer = this.#buffer.slice(this.#header.length);
            this.#headerFindFlag = false;
          }
        }
      },
    });
  }
}

export class LspEncoderStream extends TransformStream<
  LSP.ResponseMessage | LSP.NotificationMessage,
  Uint8Array
> {
  constructor() {
    super({
      transform: (chunk, controller) => {
        const content = JSON.stringify(chunk);
        const header = `Content-Length: ${content.length}\r\n\r\n`;
        controller.enqueue(new TextEncoder().encode(header + content));
      },
    });
  }
}
