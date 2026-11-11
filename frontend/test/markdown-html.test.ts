import assert from "node:assert/strict";
import {test} from "node:test";
import {JSDOM} from "jsdom";
import {htmlToMarkdown,markdownToHtml,safePageHtml,canEditVisually} from "../src/lib/content/markdown-html.ts";
const dom=new JSDOM("");
Object.assign(globalThis,{document:dom.window.document,window:dom.window});

const roundTrip=(md:string)=>htmlToMarkdown(markdownToHtml(md));

test("supported Markdown survives editing without changing the document",()=>{
 const pages=[
  "# Título\n\nUn párrafo con **negrita**, *cursiva* y un [enlace](https://uc.cl/curso).",
  "## Subtítulo\n\n- uno\n- dos\n- tres",
  "1. primero\n2. segundo\n3. tercero",
  "### Tema menor\n\nTexto simple.",
  "Línea uno  \nLínea dos en el mismo párrafo.",
  "- elemento  \n  continuación\n- siguiente",
  "- padre\n  - hijo\n  - otro hijo\n- hermano",
  "**todo en negrita** y ***negrita y cursiva***",
  "Párrafo uno.\n\nPárrafo dos.\n\n- lista\n\nCierre.",
 ];
 for(const page of pages){
  assert.equal(canEditVisually(page),true,page);
  assert.equal(roundTrip(page),page,"stored Markdown is reproduced exactly: "+page);
 }
});
test("equivalent spellings keep the same rendering and are normalized on save",()=>{
 assert.equal(roundTrip("* a\n* b"),"- a\n- b");
 assert.equal(roundTrip("__fuerte__ y _énfasis_"),"**fuerte** y *énfasis*");
 assert.equal(roundTrip("Título\n=====\n\ntexto"),"# Título\n\ntexto");
 assert.equal(canEditVisually("* a\n* b"),true);
});
test("special characters typed as text are escaped instead of becoming formatting",()=>{
 const html="<p>2 * 3 = 6 y a_b_c y [x] y `code` y &lt;b&gt; &amp; más</p><p># no es título</p><p>- ni lista</p><p>1. ni numerada</p>";
 const md=htmlToMarkdown(html);
 assert.equal(md,"2 \\* 3 = 6 y a\\_b\\_c y \\[x\\] y \\`code\\` y \\<b\\> \\& más\n\n\\# no es título\n\n\\- ni lista\n\n1\\. ni numerada");
 assert.equal(htmlToMarkdown(markdownToHtml(md)),md,"escapes are stable");
 assert.match(markdownToHtml(md),/2 \* 3 = 6/);
 assert.doesNotMatch(markdownToHtml(md),/<ul>|<ol>|<h2>|<code>/);
});
test("browser-produced HTML is cleaned: divs, b/i, nbsp, spans and scripts never reach Markdown",()=>{
 const html='<div>Hola&nbsp;<b>mundo</b> <i>cursiva</i></div><div><br></div><span style="color:red">suelto</span><p>x<script>alert(1)</script></p><ul><li>uno<br>dos</li><li><br></li></ul>';
 assert.equal(htmlToMarkdown(html),"Hola **mundo** *cursiva*\n\nsuelto\n\nxalert(1)\n\n- uno  \n  dos");
 assert.doesNotMatch(safePageHtml(html),/script|style|span|div|<b>|<i>/);
});
test("formatting spaces stay outside the markers and empty formatting disappears",()=>{
 assert.equal(htmlToMarkdown("<p><strong> hola </strong>mundo</p>"),"**hola** mundo");
 assert.equal(htmlToMarkdown("<p>a<strong> </strong>b</p>"),"a b");
 assert.equal(htmlToMarkdown("<p><em></em>solo</p>"),"solo");
});
test("only safe links are kept and special URL characters stay valid",()=>{
 assert.equal(htmlToMarkdown('<p><a href="javascript:alert(1)">malo</a> <a href="https://uc.cl/a_(b)">bueno</a></p>'),"malo [bueno](https://uc.cl/a_%28b%29)");
 assert.equal(safePageHtml('<a href="https://uc.cl/" onclick="x()" target="_blank">ok</a>'),'<a href="https://uc.cl/">ok</a>');
});
test("pages with tables, code, quotes, images or deeper headings fall back to source editing",()=>{
 for(const page of [
  "| a | b |\n|---|---|\n| 1 | 2 |",
  "```js\nconst n = 1;\n```",
  "> cita",
  "Texto con `código` en línea",
  "![texto alternativo](https://uc.cl/x.png)",
  "#### Cuarto nivel",
  "---",
  "~~tachado~~",
 ]) assert.equal(canEditVisually(page),false,page);
 assert.equal(canEditVisually("<b>html literal</b>"),true,"raw HTML is plain text for readers, so it round-trips escaped");
 assert.equal(canEditVisually(""),true);
 assert.equal(canEditVisually("   \n "),true);
});
test("an editor-generated document renders back to the same HTML a reader will see",()=>{
 const html="<h2>Título</h2><p>Texto <strong>fuerte</strong></p><ol><li>uno</li><li>dos</li></ol><h3>Sub</h3><ul><li>a</li></ul>";
 const md=htmlToMarkdown(html);
 assert.equal(md,"# Título\n\nTexto **fuerte**\n\n1. uno\n2. dos\n\n## Sub\n\n- a");
 assert.equal(safePageHtml(markdownToHtml(md)).replace(/\n/g,""),html);
});
