// A section is a thread tag with this prefix, so it syncs and persists like any other tag.
const SECTION_TAG_PREFIX = "section:";
// Thread tags cap at 64 characters, and the prefix takes 8 of them.
export const SECTION_NAME_MAX_LENGTH = 56;

type SectionTags = ReadonlyArray<string> | undefined;

function sectionTag(name: string): string {
  return `${SECTION_TAG_PREFIX}${name}`;
}

export function getThreadSection(tags: SectionTags): string | null {
  const tag = tags?.find((candidate) => candidate.startsWith(SECTION_TAG_PREFIX));
  return tag === undefined ? null : tag.slice(SECTION_TAG_PREFIX.length);
}

export function getSidebarSectionNames(tagLists: ReadonlyArray<SectionTags>): string[] {
  const names = new Set<string>();
  for (const tags of tagLists) {
    const name = getThreadSection(tags);
    if (name !== null) names.add(name);
  }
  return [...names].toSorted((a, b) => a.localeCompare(b));
}

/** Splits a shelf into threads without a section and one group per section, sorted by name. */
export function splitThreadsBySection<T>(
  threads: readonly T[],
  getTags: (thread: T) => SectionTags,
): { readonly unsectioned: readonly T[]; readonly sections: ReadonlyArray<SectionGroup<T>> } {
  const unsectioned: T[] = [];
  const bySection = new Map<string, T[]>();
  for (const thread of threads) {
    const name = getThreadSection(getTags(thread));
    if (name === null) {
      unsectioned.push(thread);
      continue;
    }
    const list = bySection.get(name);
    if (list === undefined) bySection.set(name, [thread]);
    else list.push(thread);
  }
  const sections = [...bySection.keys()]
    .toSorted((a, b) => a.localeCompare(b))
    .map((name) => ({ name, threads: bySection.get(name)! }));
  return { unsectioned, sections };
}

interface SectionGroup<T> {
  readonly name: string;
  readonly threads: readonly T[];
}

/**
 * Orders a shelf by section: threads without one first, then sections by name.
 * Threads keep their shelf order within a section.
 */
export function groupThreadsBySection<T>(
  threads: readonly T[],
  getTags: (thread: T) => SectionTags,
): readonly T[] {
  if (!threads.some((thread) => getThreadSection(getTags(thread)) !== null)) return threads;
  const { unsectioned, sections } = splitThreadsBySection(threads, getTags);
  return [...unsectioned, ...sections.flatMap((section) => section.threads)];
}

/** The key a section folder stores its open state under, beside project folders. */
export function sectionFolderExpansionKey(name: string): string {
  return sectionTag(name);
}

/** The tag changes that move a thread into `next`, or out of every section when it is null. */
export function planThreadSectionTags(
  tags: SectionTags,
  next: string | null,
): ReadonlyArray<{ readonly tag: string; readonly tagged: boolean }> {
  const nextTag = next === null ? null : sectionTag(next);
  const removals = (tags ?? [])
    .filter((tag) => tag.startsWith(SECTION_TAG_PREFIX) && tag !== nextTag)
    .map((tag) => ({ tag, tagged: false }));
  const alreadyTagged = nextTag !== null && (tags ?? []).includes(nextTag);
  return nextTag === null || alreadyTagged
    ? removals
    : [...removals, { tag: nextTag, tagged: true }];
}
