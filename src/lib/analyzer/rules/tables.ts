import { attr, idRefs, tagOf, type ParsedElement } from "../dom";
import { finding, type Rule, type RuleFinding } from "../types";

function isLayoutTable(el: ParsedElement): boolean {
  const role = (attr(el, "role") ?? "").toLowerCase();
  return role === "presentation" || role === "none";
}

/** Rules about data table structure (WCAG 1.3.1). */
export const tableRules: Rule[] = [
  {
    id: "table-headers-missing",
    title: "Data table has no header cells",
    description:
      "Table headers (<th>) let screen readers associate data cells with their row and column labels.",
    category: "tables",
    severity: "serious",
    wcag: ["1.3.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (tagOf(el) !== "table" || isLayoutTable(el)) continue;
        const cells = el.querySelectorAll("td");
        const headers = el.querySelectorAll("th");
        if (cells.length === 0 || headers.length > 0) continue;
        findings.push(
          finding("This table has data cells but no <th> header cells.", el, {
            suggestion:
              "Mark header cells up as <th scope=\"col\"> or <th scope=\"row\">. If the table is purely for layout, remove it or add role=\"presentation\".",
            codeExample: {
              before:
                "<table>\n  <tr><td>Name</td><td>Role</td></tr>\n  <tr><td>Ada</td><td>Engineer</td></tr>\n</table>",
              after:
                '<table>\n  <tr><th scope="col">Name</th><th scope="col">Role</th></tr>\n  <tr><td>Ada</td><td>Engineer</td></tr>\n</table>',
            },
          }),
        );
      }
      return findings;
    },
  },
  {
    id: "table-caption-missing",
    title: "Table has no caption",
    description:
      "A <caption> gives a table a title, which helps everyone understand the data at a glance.",
    category: "tables",
    severity: "minor",
    wcag: ["1.3.1"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "table")
        .filter((el) => !isLayoutTable(el))
        .filter((el) => el.querySelectorAll("th").length > 0)
        .filter((el) => el.querySelectorAll("caption").length === 0)
        .map((el) =>
          finding("This data table has no <caption>.", el, {
            suggestion:
              'Add a <caption> as the first child, or use aria-labelledby / aria-label to name the table.',
          }),
        ),
  },
  {
    id: "th-scope-missing",
    title: "Header cell has no scope",
    description:
      "Adding scope to <th> cells makes the header/data relationship unambiguous for assistive technology.",
    category: "tables",
    severity: "minor",
    wcag: ["1.3.1"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "th")
        .filter((el) => attr(el, "scope") === undefined)
        .filter((el) => attr(el, "headers") === undefined)
        .map((el) =>
          finding("This <th> has no scope attribute.", el, {
            suggestion: 'Add scope="col" or scope="row" to describe the header direction.',
          }),
        ),
  },
  {
    id: "td-headers-dangling",
    title: "Table cell references a missing header",
    description:
      "The headers attribute must reference the id of a header cell that exists in the same table.",
    category: "tables",
    severity: "moderate",
    wcag: ["1.3.1"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        const headers = attr(el, "headers");
        if (!headers || !["td", "th"].includes(tagOf(el))) continue;
        const missing = idRefs(headers).filter((id) => !ctx.getById(id));
        if (missing.length === 0) continue;
        findings.push(
          finding(`The headers attribute references missing id(s): ${missing.join(", ")}.`, el, {
            suggestion: "Point headers at the id of an existing <th> cell.",
          }),
        );
      }
      return findings;
    },
  },
];
