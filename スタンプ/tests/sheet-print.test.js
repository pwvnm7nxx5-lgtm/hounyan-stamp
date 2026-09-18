const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDocument } = require("../sheet-print.js");

function sheet(number, count = 20) {
  return { number, completedAt: "2026/9/18 10:00", stamps: Array.from({ length: count }, () => ({
    name: "よくできました", src: "assets/stamp-yokudekimashita.png",
  })) };
}

test("print document contains exactly twenty stamps per A4 sheet", () => {
  const html = buildDocument("児童A", [sheet(1), sheet(2)], "file:///C:/stamp/index.html");
  assert.equal((html.match(/<section class="sheet">/g) || []).length, 2);
  assert.equal((html.match(/<img /g) || []).length, 40);
  assert.match(html, /size: A4 portrait/);
  assert.match(html, /break-after: page/);
  assert.match(html, /<base href="file:\/\/\/C:\/stamp\/index.html">/);
  assert.match(html, /完成：2026\/9\/18 10:00/);
});

test("print document rejects empty and incomplete sheets", () => {
  assert.throws(() => buildDocument("児童", [], ""));
  assert.throws(() => buildDocument("児童", [sheet(1, 19)], ""));
  assert.throws(() => buildDocument("児童", [sheet(1, 21)], ""));
});

test("student text and image attributes are escaped", () => {
  const data = sheet(1);
  data.stamps[0].src = 'a" onerror="alert(1)';
  const html = buildDocument('<script>alert(1)</script>&', [data], "https://example.test/");
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes('src="a&quot; onerror=&quot;alert(1)"'));
});
