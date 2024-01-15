import { assertEquals } from "https://deno.land/std@0.212.0/assert/assert_equals.ts";
// import * as LSPTypes from "npm:vscode-languageserver-types";
import * as LSP from "npm:vscode-languageserver-protocol";

Deno.test(
  "Initialize LSP",
  { permissions: { write: true, run: true } },
  async (t) => {
    const requestContent = {
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        capabilities: {},
      } as LSP.InitializeParams,
    };
    const responseContent = {
      jsonrpc: "2.0",
      id: 0,
      result: {
        capabilities: {},
        serverInfo: {
          name: "user",
        },
      },
    };
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-write",
        "lsp.ts",
      ],
      stdin: "piped",
      stdout: "piped",
    });
    const child = command.spawn();
    await t.step("stdin", async () => {
      const header = `Content-Length: ${
        JSON.stringify(requestContent).length
      }\r\n\r\n`;
      const raw = new TextEncoder().encode(
        header + JSON.stringify(requestContent),
      );
      const writer = child.stdin.getWriter();
      await writer.write(raw);
      writer.releaseLock();
    });
    await t.step("stdout", async () => {
      const reader = child.stdout.getReader();
      const actual = await reader.read();
      reader.releaseLock();
      const header = `Content-Length: ${
        JSON.stringify(responseContent).length
      }\r\n\r\n`;
      const expected = header + JSON.stringify(responseContent);
      const str = new TextDecoder().decode(actual.value);
      assertEquals(str, expected);
    });
    // ↓これcloseとstatusの連携が無いとダメっぽい
    child.stdin.close();
    await child.status;
    await child.stdout.cancel();
  },
);
