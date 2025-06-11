import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { escapeHtml } from "./utils.ts";

Deno.test("escapeHtml converts special characters", () => {
  const input = "Tom & Jerry <script>alert('x')</script>";
  const escaped = escapeHtml(input);
  assert(!escaped.includes("<script>"));
  assert(escaped.includes("&lt;script&gt;"));
  assertEquals(
    escaped,
    "Tom &amp; Jerry &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
  );
});

Deno.test("escapeHtml prevents script injection in cafe data", () => {
  const cafeName = "<script>alert('hack')</script> Cafe";
  const html = `<div>${escapeHtml(cafeName)}</div>`;
  assert(!html.includes("<script>"));
});
