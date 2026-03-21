import { StaffTaskStatus } from '@prisma/client';

type TaskWithStaff = {
  status: StaffTaskStatus;
  staff: {
    id: string;
    user: { name: string };
    department: { id: string; name: string };
  };
};

export function buildTaskPerformanceMetrics(tasks: TaskWithStaff[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === StaffTaskStatus.COMPLETED,
  ).length;
  const completionRate =
    totalTasks === 0
      ? 0
      : Number(((completedTasks / totalTasks) * 100).toFixed(2));

  const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});

  const byDepartmentMap = tasks.reduce<
    Record<
      string,
      {
        departmentId: string;
        departmentName: string;
        total: number;
        completed: number;
      }
    >
  >((acc, task) => {
    const departmentId = task.staff.department.id;
    const current = acc[departmentId] ?? {
      departmentId,
      departmentName: task.staff.department.name,
      total: 0,
      completed: 0,
    };

    current.total += 1;
    if (task.status === StaffTaskStatus.COMPLETED) {
      current.completed += 1;
    }

    acc[departmentId] = current;
    return acc;
  }, {});

  const byStaffMap = tasks.reduce<
    Record<
      string,
      {
        staffId: string;
        name: string;
        departmentName: string;
        total: number;
        completed: number;
      }
    >
  >((acc, task) => {
    const staffId = task.staff.id;
    const current = acc[staffId] ?? {
      staffId,
      name: task.staff.user.name,
      departmentName: task.staff.department.name,
      total: 0,
      completed: 0,
    };

    current.total += 1;
    if (task.status === StaffTaskStatus.COMPLETED) {
      current.completed += 1;
    }

    acc[staffId] = current;
    return acc;
  }, {});

  return {
    summary: {
      totalTasks,
      completedTasks,
      completionRate,
      statusCounts,
    },
    byDepartment: Object.values(byDepartmentMap).map((item) => ({
      ...item,
      completionRate:
        item.total === 0
          ? 0
          : Number(((item.completed / item.total) * 100).toFixed(2)),
    })),
    byStaff: Object.values(byStaffMap)
      .map((item) => ({
        ...item,
        completionRate:
          item.total === 0
            ? 0
            : Number(((item.completed / item.total) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total),
  };
}

export function buildCommercialMetrics(params: {
  limit: number;
  buyers: Array<{
    userId: string;
    name: string;
    email: string;
    orderCount: number;
    totalSpend: number;
  }>;
  books: Array<{
    bookId: string;
    title: string;
    author: string;
    isbn: string;
    units: number;
    revenue: number;
  }>;
  fromDate?: Date;
  toDate?: Date;
}) {
  const topBooksByUnits = [...params.books]
    .sort((a, b) => b.units - a.units)
    .slice(0, params.limit);
  const topBooksByRevenue = [...params.books]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, params.limit);

  const totalRevenue = params.buyers.reduce(
    (sum, row) => sum + row.totalSpend,
    0,
  );
  const totalOrders = params.buyers.reduce(
    (sum, row) => sum + row.orderCount,
    0,
  );

  return {
    summary: {
      buyersCount: params.buyers.length,
      booksTracked: params.books.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
    },
    period: {
      fromDate: params.fromDate?.toISOString() ?? null,
      toDate: params.toDate?.toISOString() ?? null,
      limit: params.limit,
    },
    topBuyers: params.buyers,
    topBooksByUnits,
    topBooksByRevenue,
  };
}

export function mapTopBuyers(
  buyerGroups: Array<{
    userId: string;
    _count: { id: number };
    _sum: { totalPrice: unknown };
  }>,
  usersById: Map<string, { id: string; name: string; email: string }>,
) {
  return buyerGroups.map((row) => {
    const user = usersById.get(row.userId);
    return {
      userId: row.userId,
      name: user?.name ?? 'Unknown user',
      email: user?.email ?? '',
      orderCount: row._count.id,
      totalSpend: Number(row._sum.totalPrice ?? 0),
    };
  });
}

export function rollupBookSales(
  items: Array<{ bookId: string; quantity: number; price: unknown }>,
  booksById: Map<
    string,
    { id: string; title: string; author: string; isbn: string | null }
  >,
) {
  const bookRollup = items.reduce<
    Record<
      string,
      {
        bookId: string;
        units: number;
        revenue: number;
      }
    >
  >((acc, item) => {
    const current = acc[item.bookId] ?? {
      bookId: item.bookId,
      units: 0,
      revenue: 0,
    };
    current.units += item.quantity;
    current.revenue += Number(item.price) * item.quantity;
    acc[item.bookId] = current;
    return acc;
  }, {});

  return Object.values(bookRollup).map((row) => {
    const book = booksById.get(row.bookId);
    return {
      bookId: row.bookId,
      title: book?.title ?? 'Unknown book',
      author: book?.author ?? '',
      isbn: book?.isbn ?? '',
      units: row.units,
      revenue: Number(row.revenue.toFixed(2)),
    };
  });
}
