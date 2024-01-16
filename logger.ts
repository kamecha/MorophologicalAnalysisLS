import * as log from "https://deno.land/std@0.209.0/log/mod.ts";

export function logger() {
  log.setup({
    handlers: {
      file: new log.handlers.FileHandler("DEBUG", {
        filename: "./log.txt",
        formatter: "{levelName} {msg}",
      }),
    },
    loggers: {
      default: {
        level: "DEBUG",
        handlers: ["file"],
      },
    },
  });
  return log.getLogger();
}
