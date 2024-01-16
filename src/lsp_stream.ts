import { LSP } from "./deps.ts";

type LSPHeader = {
  length: number;
  type?: string; // now only support utf-8
};

export class LspDecoderStream extends TransformStream<
  Uint8Array,
  LSP.RequestMessage
> {
  #buffer = new Uint8Array();
  #header?: LSPHeader
  // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#headerPart
  #headerDecoder = new TextDecoder("ascii");
  #contentDecoder = new TextDecoder("utf-8");
  constructor() {
    super({
      transform: (chunk, controller) => {
        this.#buffer = new Uint8Array([...this.#buffer, ...chunk]);
        if (this.#header === undefined) {
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
          this.#header = {
            length: Number(headerMatch[1]),
            type: headerMatch[2],
          }
          // #bufferをheaderの分だけ削除
          this.#buffer = this.#buffer.slice(headerMatch[0].length);
        }
        if (this.#header !== undefined) {
          if (this.#buffer.length >= this.#header.length) {
            const content = this.#contentDecoder.decode(
              this.#buffer.slice(0, this.#header.length),
            );
            // contentをLSP.RequestMessage | LSP.NotificationMessageに変換
            const contentObj = JSON.parse(content);
            controller.enqueue(contentObj as LSP.RequestMessage);
            // controller.enqueue(content);
            // #bufferをcontentの分だけ削除
            this.#buffer = this.#buffer.slice(this.#header.length);
          }
        }
      },
    });
  }
}

export class LspEncoderStream extends TransformStream<
  LSP.ResponseMessage,
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
