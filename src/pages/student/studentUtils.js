// "Due in 2 days" / "Overdue" / "No deadline" → text + Tailwind colour class
export function deadlineInfo(deadline) {
  if (!deadline) return { text: "No deadline", className: "text-gray-500", overdue: false };
  const ms = new Date(deadline) - new Date();
  if (ms < 0) return { text: "Deadline passed", className: "text-red-600 font-semibold", overdue: true };
  const hours = ms / 3600000;
  if (hours < 24) return { text: `Due in ${Math.max(1, Math.round(hours))}h`, className: "text-red-600 font-semibold", overdue: false };
  const days = Math.ceil(hours / 24);
  if (days <= 3) return { text: `Due in ${days} day${days > 1 ? "s" : ""}`, className: "text-orange-600 font-semibold", overdue: false };
  return { text: `Due in ${days} days`, className: "text-gray-600", overdue: false };
}

export const FILE_HINT = "PDF, DOC/DOCX, ZIP, source code or any other file (max 50 MB)";
export const MAX_SUBMISSION_BYTES = 50 * 1024 * 1024;
