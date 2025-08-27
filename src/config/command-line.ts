import { parseArgs } from "node:util";

/**
 * コマンドライン引数をパースします。
 * 通常は process.argv をそのまま渡してください。
 * （process.argv[0]はnode、[1]はスクリプトパスなので除外されます）
 * @param args process.argv で取得した値
 */
export const parseCommandLineOptions = (args: string[]) => {
  const { values } = parseArgs({
    args: args.slice(2), // process.argv[0]はnode、[1]はスクリプトパスなので除外
    allowPositionals: true,
    options: {
      "base-url": { type: "string" },
      username: { type: "string" },
      password: { type: "string" },
      "api-token": { type: "string" },
      "basic-auth-username": { type: "string" },
      "basic-auth-password": { type: "string" },
      "pfx-file-path": { type: "string" },
      "pfx-file-password": { type: "string" },
      proxy: { type: "string" },
      "attachments-dir": { type: "string" },
    },
  });

  return values;
};
