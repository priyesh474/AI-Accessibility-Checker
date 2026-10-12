import type { Issue } from "@/types/analysis";
import { IssueCard } from "./IssueCard";

interface IssueListProps {
  issues: Issue[];
}

/** The filtered list of issue disclosures. */
export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No issues match the current filters.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {issues.map((issue, index) => (
        <li key={issue.id}>
          <IssueCard issue={issue} index={index + 1} />
        </li>
      ))}
    </ul>
  );
}
