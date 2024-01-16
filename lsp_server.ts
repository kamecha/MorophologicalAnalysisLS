import { LSP } from "./deps.ts";

export class LspServer {
  public response(
    request: LSP.RequestMessage,
  ): LSP.ResponseMessage {
    switch (request.method) {
      case "initialize":
        return {
          jsonrpc: request.jsonrpc,
          id: request.id,
          result: this.initialize(),
        };
      default:
        throw new Error("Method not implemented.");
    }
  }

  initialize(): LSP.InitializeResult {
    return {
      capabilities: {},
    };
  }
}
