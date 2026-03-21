import { PrismaClient } from '@prisma/client';

type ReadingSessionLite = {
  id: string;
  userId: string;
  bookId: string;
  readingItemId: string | null;
  pagesRead: number;
  sessionDate: Date;
  createdAt: Date;
};

const prisma = new PrismaClient();

const toMinuteKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getUTCDate()).padStart(2, '0')}T${String(
    date.getUTCHours(),
  ).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;

const buildGroupKey = (session: ReadingSessionLite) =>
  [
    session.userId,
    session.bookId,
    session.readingItemId ?? 'none',
    toMinuteKey(session.sessionDate),
  ].join('|');

async function main() {
  const apply = process.argv.includes('--apply');
  const candidateSessions = await prisma.readingSession.findMany({
    where: {
      notes: null,
    },
    select: {
      id: true,
      userId: true,
      bookId: true,
      readingItemId: true,
      pagesRead: true,
      sessionDate: true,
      createdAt: true,
    },
    orderBy: [{ sessionDate: 'asc' }, { createdAt: 'asc' }],
  });

  const grouped = new Map<string, ReadingSessionLite[]>();
  for (const session of candidateSessions) {
    const key = buildGroupKey(session);
    const existing = grouped.get(key) ?? [];
    existing.push(session);
    grouped.set(key, existing);
  }

  const duplicateGroups = Array.from(grouped.values()).filter(
    (group) => group.length > 1,
  );

  if (duplicateGroups.length === 0) {
    console.log('No duplicate autosave session groups found.');
    return;
  }

  const plannedMerges = duplicateGroups.map((group) => {
    const sorted = [...group].sort((a, b) => {
      const bySessionDate = a.sessionDate.getTime() - b.sessionDate.getTime();
      if (bySessionDate !== 0) return bySessionDate;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    const keep = sorted[0];
    const remove = sorted.slice(1);
    const mergedPages = sorted.reduce((sum, item) => sum + item.pagesRead, 0);
    return { keep, remove, mergedPages };
  });

  const deleteCount = plannedMerges.reduce(
    (sum, merge) => sum + merge.remove.length,
    0,
  );
  console.log(
    `Found ${duplicateGroups.length} duplicate groups. ${deleteCount} rows can be removed.`,
  );

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to perform the merge.');
    for (const merge of plannedMerges.slice(0, 10)) {
      console.log(
        [
          `keep=${merge.keep.id}`,
          `user=${merge.keep.userId}`,
          `book=${merge.keep.bookId}`,
          `sessionDate=${merge.keep.sessionDate.toISOString()}`,
          `rows=${merge.remove.length + 1}`,
          `mergedPages=${merge.mergedPages}`,
        ].join(' | '),
      );
    }
    if (plannedMerges.length > 10) {
      console.log(`... ${plannedMerges.length - 10} more groups omitted`);
    }
    return;
  }

  for (const merge of plannedMerges) {
    await prisma.$transaction([
      prisma.readingSession.update({
        where: { id: merge.keep.id },
        data: {
          pagesRead: merge.mergedPages,
        },
      }),
      prisma.readingSession.deleteMany({
        where: {
          id: {
            in: merge.remove.map((item) => item.id),
          },
        },
      }),
    ]);
  }

  console.log(
    `Merged ${plannedMerges.length} groups. Deleted ${deleteCount} duplicate rows.`,
  );
}

main()
  .catch((error) => {
    console.error('Failed to merge duplicate ebook autosave sessions.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
