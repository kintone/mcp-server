/** `client.app.getApp`のレスポンスとして妥当な最小限のサンプルデータ。 */
export const SAMPLE_APP_RESPONSE = {
  appId: "1",
  code: "",
  name: "Test App",
  description: "",
  spaceId: null,
  threadId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  creator: { code: "admin", name: "Administrator" },
  modifiedAt: "2024-01-01T00:00:00.000Z",
  modifier: { code: "admin", name: "Administrator" },
} as const;
