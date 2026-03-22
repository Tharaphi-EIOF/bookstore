export const STAFF_USER_BASIC_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarType: true,
  avatarValue: true,
} as const;

export const STAFF_USER_WITH_ROLE_SELECT = {
  ...STAFF_USER_BASIC_SELECT,
  role: true,
} as const;

export const STAFF_ROLE_WITH_PERMISSIONS_INCLUDE = {
  permissions: {
    include: {
      permission: true,
    },
  },
} as const;

export const STAFF_ASSIGNMENT_WITH_ROLE_INCLUDE = {
  role: {
    include: {
      ...STAFF_ROLE_WITH_PERMISSIONS_INCLUDE,
    },
  },
} as const;

export const STAFF_ROLE_WITH_PERMISSIONS_SORTED_INCLUDE = {
  permissions: {
    include: {
      permission: true,
    },
    orderBy: {
      permission: {
        key: 'asc',
      },
    },
  },
} as const;

export const STAFF_TASK_WITH_STAFF_INCLUDE = {
  staff: {
    include: {
      user: {
        select: STAFF_USER_BASIC_SELECT,
      },
      department: true,
    },
  },
} as const;

export const STAFF_PROFILE_FULL_INCLUDE = {
  user: {
    select: STAFF_USER_WITH_ROLE_SELECT,
  },
  department: true,
  manager: {
    include: {
      user: {
        select: STAFF_USER_BASIC_SELECT,
      },
    },
  },
  assignments: {
    include: {
      role: {
        include: {
          ...STAFF_ROLE_WITH_PERMISSIONS_INCLUDE,
        },
      },
    },
    orderBy: { effectiveFrom: 'desc' },
  },
  _count: {
    select: {
      tasks: true,
    },
  },
} as const;

export const STAFF_PROFILE_DETAIL_INCLUDE = {
  user: {
    select: STAFF_USER_WITH_ROLE_SELECT,
  },
  department: true,
  manager: {
    include: {
      user: {
        select: STAFF_USER_BASIC_SELECT,
      },
    },
  },
  directReports: {
    include: {
      user: {
        select: STAFF_USER_BASIC_SELECT,
      },
    },
  },
  assignments: {
    include: {
      role: {
        include: {
          ...STAFF_ROLE_WITH_PERMISSIONS_INCLUDE,
        },
      },
    },
    orderBy: { effectiveFrom: 'desc' },
  },
  tasks: {
    orderBy: { createdAt: 'desc' },
    take: 25,
  },
} as const;
