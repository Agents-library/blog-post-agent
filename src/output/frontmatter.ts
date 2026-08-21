import matter from "gray-matter";

const FALLBACK_TITLE = "Project Update";

export interface FrontmatterInput {
  title?: string;
  date?: string;
  tags?: string[];
  summary?: string;
  /** Generated body used to infer title and summary when those fields are omitted. */
  content?: string;
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function inferTitle(content?: string): string {
  if (!content) {
    return FALLBACK_TITLE;
  }

  for (const line of content.split(/\r?\n/)) {
    const heading = line.trim().match(/^#\s+(.+)$/);
    if (heading) {
      const title = heading[1].trim();
      if (title.length > 0) {
        return title;
      }
    }
  }

  return FALLBACK_TITLE;
}

function inferSummary(content?: string): string {
  if (!content) {
    return "";
  }

  const collected: string[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (collected.length > 0) {
        break;
      }
      continue;
    }
    if (/^#{1,6}\s/.test(trimmed)) {
      continue;
    }

    collected.push(trimmed);
    if (collected.join(" ").length >= 160) {
      break;
    }
  }

  const text = collected.join(" ");
  if (text.length <= 200) {
    return text;
  }

  return `${text.slice(0, 197).trimEnd()}...`;
}

export function buildFrontmatter(input: FrontmatterInput = {}): string {
  const data = {
    title: input.title ?? inferTitle(input.content),
    date: input.date ?? todayIsoDate(),
    tags: input.tags ?? [],
    summary: input.summary ?? inferSummary(input.content),
  };

  return `${matter.stringify("", data).trimEnd()}\n`;
}
