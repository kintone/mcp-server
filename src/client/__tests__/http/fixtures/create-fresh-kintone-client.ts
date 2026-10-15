import { vi } from "vitest";
import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { KintoneClientConfig } from "../../../index.js";

/**
 * `getKintoneClient`はモジュールレベルのシングルトンを持つため
 * (`src/client/index.ts`)、テストごとに異なる設定のクライアントを
 * 作りたい場合は`vi.resetModules()`してモジュールを再読み込みする必要がある。
 * これを忘れると2本目以降のテストが1本目のクライアントを使い回してしまい、
 * 意図した設定（プロキシ・証明書等）が反映されないまま無言でパスする。
 */
export const createFreshKintoneClient = async (
  config: KintoneClientConfig,
): Promise<KintoneRestAPIClient> => {
  vi.resetModules();
  const module = await import("../../../index.js");
  return module.getKintoneClient(config);
};
