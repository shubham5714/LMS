import { readFileSync } from "fs";
const html = readFileSync("references/template.html", "utf8");
const needles = [
  "INTEGRATIONS",
  "Works with the tools your team already loves",
  "Planquo replaces disconnected tools with a unified workspace",
];
for (const n of needles) {
  let from = 0;
  let c = 0;
  console.log("\n#####", n);
  while (c < 6) {
    const i = html.indexOf(n, from);
    if (i < 0) break;
    console.log("---", c, "at", i);
    console.log(html.slice(Math.max(0, i - 220), i + n.length + 80).replace(/\n/g, " "));
    from = i + n.length;
    c++;
  }
  if (c === 0) console.log("NOT FOUND as contiguous string");
}
