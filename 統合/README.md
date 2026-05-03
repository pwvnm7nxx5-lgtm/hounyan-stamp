# 学校プリントツール

連絡帳作成アプリと漢字なぞりプリントをまとめた入口ページです。

## 開き方

`index.html` をブラウザで開きます。

各アプリは `apps/` の中で独立して動きます。印刷やPDF保存は、それぞれのアプリ画面で行います。

## 新しいアプリの追加

1. `apps/` の中に新しいアプリ用フォルダを作ります。
2. そのフォルダに `index.html`、`styles.css`、`app.js` などを入れます。
3. `apps.config.js` の `window.INTEGRATED_APPS` に1件追加します。

例:

```js
{
  id: "new-tool",
  title: "新しいツール",
  description: "トップページに表示する説明です。",
  category: "教材",
  tags: ["印刷"],
  href: "apps/new-tool/index.html",
  actionLabel: "開く",
  status: "ready",
  accent: "#6750a4",
}
```

`href` は統合トップページから見た相対パスにします。
