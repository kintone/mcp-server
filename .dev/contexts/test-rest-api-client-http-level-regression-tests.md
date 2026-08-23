# test/rest-api-client-http-level-regression-tests 対話コンテキスト

- PR: #560
- Branch: `test/rest-api-client-http-level-regression-tests`
- Source commit: baf2f21
- Updated at: 2026-08-23 12:10:36

## 目的

「axiosの実装を捨てたい」という要望から出発し、axiosはこのリポジトリで直接使われておらず`@kintone/rest-api-client`経由の推移的依存のみであることが判明。上流でaxios→fetch移行PR（[kintone/js-sdk#3937](https://github.com/kintone/js-sdk/pull/3937)、実装者本人が作成）が進行中だが未マージ。

続いて「rest-api-clientの依存箇所はHttpレベルのテストで保護されているか」という質問を受けて調査したところ、既存の単体テストは全て`KintoneRestAPIClient`をモックしており実HTTP通信の検証がないことが判明した。特に`src/client/index.ts`の`buildHttpsAgent`がプロキシ指定時に構築する`HttpsProxyAgent`（独自のCONNECTトンネリング接続ロジックを持つカスタムAgent）は、上流PRの破壊的変更ノート（「`httpsAgent`は将来TLS証明書プロパティの入れ物としてしか読まれず、カスタムAgentの独自接続ロジックは無視される」）に直撃するリスクがあり、既存テストではこの退行を検知できない。本PRはこの穴を塞ぐための回帰テスト追加。

## 設計方針

- リファクタ（`buildHttpsAgent`を`proxy`/`clientCertAuth`専用オプションへ切り替える）はせず、現状実装（`httpsAgent`+`HttpsProxyAgent`/手組みの`https.Agent`）を保護する回帰テストのみを先に書く方針をユーザーが選択した
- テストのスコープはプロキシ経路・クライアント証明書(mTLS)・ファイルダウンロード(ArrayBuffer)・通常API呼び出しの4系統全てとする方針をユーザーが選択した
- モックライブラリ（msw等）は追加せず、`node:http`/`node:https`の標準モジュールのみで実サーバー・実プロキシを構築する方針を採用した

## 却下した代替案

- `buildHttpsAgent`を`proxy`/`clientCertAuth`オプション（`@kintone/rest-api-client@6.2.1`時点で既に存在することをnpm tarballの型定義で確認済み）へ今すぐリファクタする案は、却下ではなく **後回し** にされた。テスト先行の方針をユーザーが選んだため。この選択の結果、将来rest-api-clientをfetch移行後のバージョンへ上げた時点で、テストが落ちて気づくまでの間、実際にプロキシ機能が一時的に壊れる期間が生じ得る。この対応方針は`proxy.http.test.ts`の冒頭コメントに明記済み

## 意図的に対応しないこと

- 本PRでは`src/client/index.ts`（本体実装コード）への変更は行わない。テストのみを追加する

## 発見された制約

- `KintoneRestAPIClient`のコンストラクタは`baseUrl`のプロトコルが`https`であることを必須としており（`validateBaseUrl`）、plain httpのテストサーバーでは`KintoneRestAPIClient`自体が構築できない。プロキシ以外の3系統（api-call/download-file/client-cert-auth）のテストも、自己署名証明書によるHTTPSサーバーが必要
- `getKintoneClient`（`src/client/index.ts`）はモジュールレベルの`let client`によるシングルトンを持つ。テストごとに異なる設定のクライアントを作るには`vi.resetModules()`+動的importが必須（既存の`client.test.ts`と同じ手法）
- `src/client/index.ts`の`buildHttpsAgent`には、サーバー証明書側を信頼させるための`ca`/`rejectUnauthorized`をhttpsAgentへ渡す経路がない。テスト用の自己署名サーバー証明書をクライアントに信頼させる手段が`NODE_TLS_REJECT_UNAUTHORIZED`の一時無効化以外にない

## 新たに確認できた事実

- `@kintone/rest-api-client@6.2.1`（このリポジトリが現在ピン止めしているバージョン）には、npmのtarballを取得して型定義を直接確認した結果、既に専用の`proxy`オプション（`{protocol, host, port, auth} | false`形式）と`clientCertAuth`オプション（`{pfx, password}`または`{pfxFilePath, password}`）が存在する
- このリポジトリには`isAxiosError`・`error.code`・`KintoneRestAPIError`等、axios固有のエラー形状に依存しているコードは無い（grep確認済み）。上流のaxios→fetch移行によるエラーオブジェクトの形状変化（`AxiosError`→`FetchClientError`）はこのリポジトリには影響しない
- 上流PR #3937のCIは全てpassしているが、まだOPEN・未マージで、人間によるレビューはまだ入っていない（Copilotのレビューコメントのみ）
- vitest 4.1.10（このリポジトリが使うバージョン）のデフォルトpoolは`forks`（別OSプロセス）であり、`threads`ではない。`process.env`の変更はプロセス単位で完全に分離されるため、`NODE_TLS_REJECT_UNAUTHORIZED`をテストのbeforeEach/afterEachで一時的に切り替える手法は、テストファイル間の競合を起こさない（`--pool=threads`を明示指定した場合でもvitestは`SHARE_ENV`を使用していないため同様に安全）
- `client-cert-auth.http.test.ts`の「wrong passphrase」テストは、`buildHttpsAgent`のPFX分岐を完全に無効化（クライアント証明書を一切送らない）しても、mTLSサーバーが同様に接続を拒否するため、そのままでは検知に寄与しない。エラーメッセージ（`clientCertAuth`固有の`"invalid clientCertAuth setting"`、内部的には`mac verify failure`起因）を明示的に検証するようアサーションを厳密化することで、PFX分岐が壊れた場合にもこのテストが正しく失敗するようになる（修正済み、mutation testで再確認済み）

## 注意が必要な難所

- テスト用HTTPプロキシサーバー（`TestConnectProxyServer`）の`close()`は、`server.closeAllConnections()`だけでは`server.close()`のコールバックが呼ばれずハングする。CONNECTメソッドでハイジャックされたソケットは、Node.jsの`http.Server`の通常のコネクション追跡から外れるため。`"connection"`イベントで生ソケットを自前で追跡し、`close()`時に明示的に`destroy()`する必要がある
- `NODE_TLS_REJECT_UNAUTHORIZED`を`process.env.X = original`で復元する際、`original`が`undefined`の場合、Node.jsはキー削除ではなく文字列`"undefined"`を代入してしまう（`delete`と`= undefined`は異なる）。`original === undefined`の場合は明示的に`delete`する必要がある（このPRで修正済み。sanity-reviewの2体の独立subagentが別々の手法で発見）
- Reviewer（Claude自身）が会話中に「vitestのデフォルトpoolはthreadsなのでprocess.envはスレッドごとに分離され安全」と説明したことがあったが、これは前提が誤りだった（実際のデフォルトはforks）。結論（安全性）自体への影響はないが、根拠説明の誤りとして記録しておく

## 残作業

なし（`sanity-review`スキルで検出された3点の修正は本コンテキストのexport時点で完了済み）。上流の`@kintone/rest-api-client`がaxios→fetch移行版をリリースした際の`proxy`オプションへの切り替えは、本PRのスコープ外の将来作業として`proxy.http.test.ts`の冒頭コメントに記載されている。
