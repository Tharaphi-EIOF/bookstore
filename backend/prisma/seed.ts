import 'dotenv/config';
import { PrismaClient, Role, NotificationType, ReadingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const coverFromIsbn = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.partnerSettlement.deleteMany();
  await prisma.partnerConsignmentDeal.deleteMany();
  await prisma.bookLead.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.warehouseAlert.deleteMany();
  await prisma.warehouseTransfer.deleteMany();
  await prisma.storeTransfer.deleteMany();
  await prisma.storeStock.deleteMany();
  await prisma.store.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.staffTask.deleteMany();
  await prisma.staffAuditLog.deleteMany();
  await prisma.inquiryInternalNote.deleteMany();
  await prisma.inquiryMessage.deleteMany();
  await prisma.inquiryAudit.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.staffAssignment.deleteMany();
  await prisma.staffRolePermission.deleteMany();
  await prisma.staffRole.deleteMany();
  await prisma.staffPermission.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.department.deleteMany();
  await prisma.blogNotification.deleteMany();
  await prisma.blogPostBookReference.deleteMany();
  await prisma.blogPostTag.deleteMany();
  await prisma.blogPostAnonymousView.deleteMany();
  await prisma.blogPostView.deleteMany();
  await prisma.blogLike.deleteMany();
  await prisma.blogComment.deleteMany();
  await prisma.blogTag.deleteMany();
  await prisma.authorFollow.deleteMany();
  await prisma.authorBlog.deleteMany();
  await prisma.blogPageSetting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.loyaltyRedemption.deleteMany();
  await prisma.loyaltyReward.deleteMany();
  await prisma.stickerLedger.deleteMany();
  await prisma.promotionCode.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.savedAddress.deleteMany();
  await prisma.stockAlertSubscription.deleteMany();
  await prisma.userBookAccess.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ebookHighlight.deleteMany();
  await prisma.ebookNote.deleteMany();
  await prisma.ebookBookmark.deleteMany();
  await prisma.ebookProgress.deleteMany();
  await prisma.readingSession.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.favoriteItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Create super admin and admin users
  console.log('👤 Creating super admin and admin users...');
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.user.create({
    data: {
      email: 'superadmin@bookstore.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bookstore.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  // Create regular users
  console.log('👥 Creating regular users...');
  const userPassword = await bcrypt.hash('user123', 10);
  const coreUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        password: userPassword,
        name: 'John Doe',
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        password: userPassword,
        name: 'Jane Smith',
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.wilson@example.com',
        password: userPassword,
        name: 'Bob Wilson',
        role: Role.USER,
      },
    }),
  ]);

  // Create additional users
  console.log('👤 Creating additional users...');
  const extraUsersData = [
    { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
    { name: 'Michael Brown', email: 'michael.brown@example.com' },
    { name: 'Sarah Davis', email: 'sarah.davis@example.com' },
    { name: 'David Miller', email: 'david.miller@example.com' },
    { name: 'Emily Wilson', email: 'emily.wilson@example.com' },
    { name: 'Christopher Moore', email: 'christopher.moore@example.com' },
    { name: 'Jessica Taylor', email: 'jessica.taylor@example.com' },
    { name: 'Daniel Anderson', email: 'daniel.anderson@example.com' },
    { name: 'Ashley Thomas', email: 'ashley.thomas@example.com' },
    { name: 'Matthew Jackson', email: 'matthew.jackson@example.com' },
    { name: 'Amanda White', email: 'amanda.white@example.com' },
    { name: 'James Harris', email: 'james.harris@example.com' },
    { name: 'Lauren Martin', email: 'lauren.martin@example.com' },
    { name: 'Joshua Thompson', email: 'joshua.thompson@example.com' },
    { name: 'Brianna Garcia', email: 'brianna.garcia@example.com' },
    { name: 'Andrew Martinez', email: 'andrew.martinez@example.com' },
    { name: 'Samantha Robinson', email: 'samantha.robinson@example.com' },
    { name: 'Ryan Clark', email: 'ryan.clark@example.com' },
    { name: 'Natalie Rodriguez', email: 'natalie.rodriguez@example.com' },
    { name: 'Kevin Lewis', email: 'kevin.lewis@example.com' },
  ];
  const extraUsers = await Promise.all(
    extraUsersData.map((user) =>
      prisma.user.create({
        data: {
          email: user.email,
          password: userPassword,
          name: user.name,
          role: Role.USER,
          avatarType: 'emoji',
          avatarValue: `avatar-${(extraUsersData.indexOf(user) % 8) + 1}`,
          backgroundColor: ['bg-rose-100', 'bg-sky-100', 'bg-amber-100', 'bg-emerald-100'][
            extraUsersData.indexOf(user) % 4
          ],
          pronouns: ['she/her', 'he/him', 'they/them'][extraUsersData.indexOf(user) % 3],
          shortBio: `${user.name.split(' ')[0]} is building a reading list that mixes fiction, essays, and poetry.`,
          about:
            'Enjoys bookstore discoveries, writing marginal notes, and testing every shelf in the app.',
          location: ['San Francisco, CA', 'Austin, TX', 'New York, NY', 'Seattle, WA'][
            extraUsersData.indexOf(user) % 4
          ],
          timezone: ['America/Los_Angeles', 'America/Chicago', 'America/New_York'][
            extraUsersData.indexOf(user) % 3
          ],
          language: 'en',
          showFollowers: true,
          showFollowing: true,
          showFavorites: extraUsersData.indexOf(user) % 2 === 0,
          showLikedPosts: extraUsersData.indexOf(user) % 3 === 0,
          supportEnabled: extraUsersData.indexOf(user) % 5 === 0,
          supportUrl:
            extraUsersData.indexOf(user) % 5 === 0
              ? `https://buymeacoffee.com/${user.name.toLowerCase().replace(/\s+/g, '-')}`
              : null,
          supportQrImage:
            extraUsersData.indexOf(user) % 5 === 0
              ? `https://example.com/qr/${user.name.toLowerCase().replace(/\s+/g, '-')}.png`
              : null,
        },
      }),
    ),
  );

  const users = [...coreUsers, ...extraUsers];

  await prisma.user.updateMany({
    where: { id: { in: users.slice(0, 8).map((user) => user.id) } },
    data: {
      showFavorites: true,
      showLikedPosts: true,
    },
  });

  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      avatarType: 'emoji',
      avatarValue: 'avatar-9',
      backgroundColor: 'bg-stone-200',
      pronouns: 'they/them',
      shortBio: 'Keeps the store catalog, staff tools, and community features in order.',
      about:
        'System administrator profile used for moderation, inventory approval, and high-level test flows.',
      location: 'Head Office',
      timezone: 'America/New_York',
      supportEnabled: false,
    },
  });

  const enrichedCoreUsers = await Promise.all(
    [
      {
        id: coreUsers[0].id,
        pronouns: 'he/him',
        shortBio: 'Reads literary fiction and writes late-night review drafts.',
        location: 'San Francisco, CA',
        supportEnabled: true,
      },
      {
        id: coreUsers[1].id,
        pronouns: 'she/her',
        shortBio: 'Tracks every recommendation and keeps a dense favorites shelf.',
        location: 'New York, NY',
        supportEnabled: false,
      },
      {
        id: coreUsers[2].id,
        pronouns: 'he/him',
        shortBio: 'Buys science fiction in bulk and leaves blunt but useful reviews.',
        location: 'Austin, TX',
        supportEnabled: true,
      },
    ].map((profile, index) =>
      prisma.user.update({
        where: { id: profile.id },
        data: {
          avatarType: 'emoji',
          avatarValue: `avatar-${index + 1}`,
          backgroundColor: ['bg-sky-100', 'bg-lime-100', 'bg-orange-100'][index],
          pronouns: profile.pronouns,
          shortBio: profile.shortBio,
          about:
            'Seeded profile for testing community, reading, and storefront behavior across multiple features.',
          location: profile.location,
          timezone: ['America/Los_Angeles', 'America/New_York', 'America/Chicago'][index],
          showFavorites: true,
          showLikedPosts: true,
          supportEnabled: profile.supportEnabled,
          supportUrl: profile.supportEnabled
            ? `https://example.com/support/${index + 1}`
            : null,
          supportQrImage: profile.supportEnabled
            ? `https://example.com/support/${index + 1}.png`
            : null,
        },
      }),
    ),
  );
  users.splice(0, enrichedCoreUsers.length, ...enrichedCoreUsers);

  console.log('🔔 Creating sample notifications...');
  const notificationTemplates: Array<{
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }> = [
    {
      type: 'support_reply',
      title: 'Staff replied to your inquiry',
      message: 'Our support team replied to your latest message.',
      link: '/contact/support',
    },
    {
      type: 'announcement',
      title: 'Weekend flash sale is live',
      message: 'Save up to 35% on selected bestsellers this weekend.',
      link: '/books',
    },
    {
      type: 'inquiry_update',
      title: 'Your inquiry was updated',
      message: 'Your business inquiry status changed. Please review the latest update.',
      link: '/contact/business',
    },
    {
      type: 'system',
      title: 'Library tips available',
      message: 'Track reading progress and set a daily goal from your library.',
      link: '/library',
    },
  ];

  const notificationSeedData = users.slice(0, 10).flatMap((user, index) =>
    notificationTemplates.map((template, innerIndex) => ({
      userId: user.id,
      type: template.type,
      title: template.title,
      message: template.message,
      link: template.link,
      isRead: (index + innerIndex) % 3 === 0,
    })),
  );
  if (notificationSeedData.length > 0) {
    await prisma.notification.createMany({
      data: notificationSeedData,
    });
  }

  await prisma.blogPageSetting.create({
    data: {
      id: 'main',
      eyebrow: 'Treasure House Journal',
      title: 'Essays, Poems, and Reading Notes',
      introLines: [
        'A shared writing desk for readers, reviewers, and poets.',
        'Use this seeded page to test publishing, moderation, reactions, follows, and support links.',
      ],
    },
  });

  await prisma.promotionCode.createMany({
    data: [
      {
        code: 'BOOKLOVER10',
        name: '10% off orders over $30',
        description: 'Core loyalty discount for everyday readers.',
        discountType: 'PERCENT',
        discountValue: 10,
        minSubtotal: 30,
        maxDiscountAmount: 25,
        isActive: true,
      },
      {
        code: 'WELCOME15',
        name: '$15 off orders over $80',
        description: 'Intro offer for larger first orders.',
        discountType: 'FIXED',
        discountValue: 15,
        minSubtotal: 80,
        isActive: true,
      },
      {
        code: 'SPRINGREADS20',
        name: 'Spring campaign 20%',
        description: 'Seasonal promotion for selected collections.',
        discountType: 'PERCENT',
        discountValue: 20,
        minSubtotal: 50,
        maxDiscountAmount: 40,
        startsAt: new Date('2026-03-01T00:00:00.000Z'),
        endsAt: new Date('2026-04-15T23:59:59.000Z'),
        isActive: true,
      },
    ],
  });

  console.log('🏢 Seeding staff departments and permissions...');
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'HR' },
      update: { name: 'HR', description: 'Hiring, onboarding, and performance.' },
      create: {
        code: 'HR',
        name: 'HR',
        description: 'Hiring, onboarding, and performance.',
        isActive: true,
      },
    }),
    prisma.department.upsert({
      where: { code: 'CS' },
      update: {
        name: 'Customer Service',
        description: 'Customer inquiry and ticket resolution.',
      },
      create: {
        code: 'CS',
        name: 'Customer Service',
        description: 'Customer inquiry and ticket resolution.',
        isActive: true,
      },
    }),
    prisma.department.upsert({
      where: { code: 'STOCK' },
      update: {
        name: 'Stock Management',
        description: 'Warehouse stock updates and transfers.',
      },
      create: {
        code: 'STOCK',
        name: 'Stock Management',
        description: 'Warehouse stock updates and transfers.',
        isActive: true,
      },
    }),
    prisma.department.upsert({
      where: { code: 'FIN' },
      update: {
        name: 'Finance',
        description: 'Reports, refunds, and payouts.',
      },
      create: {
        code: 'FIN',
        name: 'Finance',
        description: 'Reports, refunds, and payouts.',
        isActive: true,
      },
    }),
    prisma.department.upsert({
      where: { code: 'MKT' },
      update: {
        name: 'Marketing',
        description: 'Campaigns, sponsored placements, and promotions.',
      },
      create: {
        code: 'MKT',
        name: 'Marketing',
        description: 'Campaigns, sponsored placements, and promotions.',
        isActive: true,
      },
    }),
  ]);

  const permissionKeys = [
    'inquiries.create',
    'inquiries.view',
    'support.inquiries.view',
    'support.inquiries.reply',
    'support.inquiries.assign',
    'support.inquiries.escalate',
    'finance.inquiries.view',
    'finance.inquiries.reply',
    'finance.inquiries.manage',
    'marketing.inquiries.view',
    'marketing.inquiries.reply',
    'marketing.inquiries.manage',
    'department.inquiries.view',
    'department.inquiries.reply',
    'staff.view',
    'staff.manage',
    'warehouse.view',
    'warehouse.stock.update',
    'warehouse.transfer',
    'warehouse.purchase_request.create',
    'warehouse.purchase_request.view',
    'warehouse.purchase_request.complete',
    'warehouse.vendor.manage',
    'warehouse.purchase_order.view',
    'warehouse.purchase_order.create',
    'warehouse.purchase_order.receive',
    'support.messages.view',
    'support.messages.reply',
    'support.messages.resolve',
    'finance.reports.view',
    'finance.refund.approve',
    'finance.payout.manage',
    'finance.purchase_request.review',
    'finance.purchase_request.approve',
    'finance.purchase_request.reject',
    'finance.purchase_order.view',
    'hr.staff.create',
    'hr.staff.update',
    'hr.performance.manage',
  ];

  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.staffPermission.upsert({
        where: { key },
        update: {},
        create: { key },
      }),
    ),
  );

  const permissionsByKey = new Map(permissions.map((permission) => [permission.key, permission]));
  const departmentsByCode = new Map(departments.map((department) => [department.code, department]));

  const hrManagerRole = await prisma.staffRole.upsert({
    where: {
      name_departmentId: {
        name: 'HR Manager',
        departmentId: departmentsByCode.get('HR')!.id,
      },
    },
    update: { code: 'HR_MANAGER' },
    create: {
      code: 'HR_MANAGER',
      name: 'HR Manager',
      departmentId: departmentsByCode.get('HR')!.id,
      isSystem: true,
    },
  });

  const warehouseSupervisorRole = await prisma.staffRole.upsert({
    where: {
      name_departmentId: {
        name: 'Warehouse Supervisor',
        departmentId: departmentsByCode.get('STOCK')!.id,
      },
    },
    update: { code: 'STOCK_WAREHOUSE_SUPERVISOR' },
    create: {
      code: 'STOCK_WAREHOUSE_SUPERVISOR',
      name: 'Warehouse Supervisor',
      departmentId: departmentsByCode.get('STOCK')!.id,
      isSystem: true,
    },
  });

  const financeApproverRole = await prisma.staffRole.upsert({
    where: {
      name_departmentId: {
        name: 'Finance Approver',
        departmentId: departmentsByCode.get('FIN')!.id,
      },
    },
    update: { code: 'FIN_FINANCE_APPROVER' },
    create: {
      code: 'FIN_FINANCE_APPROVER',
      name: 'Finance Approver',
      departmentId: departmentsByCode.get('FIN')!.id,
      isSystem: true,
    },
  });

  const supportAgentRole = await prisma.staffRole.upsert({
    where: {
      name_departmentId: {
        name: 'Support Agent',
        departmentId: departmentsByCode.get('CS')!.id,
      },
    },
    update: { code: 'CS_SUPPORT_AGENT' },
    create: {
      code: 'CS_SUPPORT_AGENT',
      name: 'Support Agent',
      departmentId: departmentsByCode.get('CS')!.id,
      isSystem: true,
    },
  });

  const marketingManagerRole = await prisma.staffRole.upsert({
    where: {
      name_departmentId: {
        name: 'Marketing Manager',
        departmentId: departmentsByCode.get('MKT')!.id,
      },
    },
    update: { code: 'MKT_MARKETING_MANAGER' },
    create: {
      code: 'MKT_MARKETING_MANAGER',
      name: 'Marketing Manager',
      departmentId: departmentsByCode.get('MKT')!.id,
      isSystem: true,
    },
  });

  await prisma.staffRolePermission.deleteMany({
    where: {
      roleId: {
        in: [hrManagerRole.id, warehouseSupervisorRole.id, financeApproverRole.id, supportAgentRole.id, marketingManagerRole.id],
      },
    },
  });

  await prisma.staffRolePermission.createMany({
    data: [
      ...['staff.view', 'staff.manage', 'hr.staff.create', 'hr.staff.update', 'hr.performance.manage'].map((key) => ({
        roleId: hrManagerRole.id,
        permissionId: permissionsByKey.get(key)!.id,
      })),
      ...[
        'warehouse.view',
        'warehouse.stock.update',
        'warehouse.transfer',
        'warehouse.purchase_request.create',
        'warehouse.purchase_request.view',
        'warehouse.purchase_request.complete',
        'warehouse.purchase_order.view',
        'warehouse.purchase_order.create',
        'warehouse.purchase_order.receive',
        'department.inquiries.view',
        'department.inquiries.reply',
      ].map((key) => ({
        roleId: warehouseSupervisorRole.id,
        permissionId: permissionsByKey.get(key)!.id,
      })),
      ...[
        'finance.reports.view',
        'finance.refund.approve',
        'finance.payout.manage',
        'warehouse.purchase_request.view',
        'warehouse.purchase_order.view',
        'finance.purchase_request.review',
        'finance.purchase_request.approve',
        'finance.purchase_request.reject',
        'finance.inquiries.view',
        'finance.inquiries.reply',
        'finance.inquiries.manage',
      ].map((key) => ({
        roleId: financeApproverRole.id,
        permissionId: permissionsByKey.get(key)!.id,
      })),
      ...[
        'support.messages.view',
        'support.messages.reply',
        'support.messages.resolve',
        'support.inquiries.view',
        'support.inquiries.reply',
        'support.inquiries.assign',
        'support.inquiries.escalate',
      ].map((key) => ({
        roleId: supportAgentRole.id,
        permissionId: permissionsByKey.get(key)!.id,
      })),
      ...[
        'marketing.inquiries.view',
        'marketing.inquiries.reply',
        'marketing.inquiries.manage',
      ].map((key) => ({
        roleId: marketingManagerRole.id,
        permissionId: permissionsByKey.get(key)!.id,
      })),
    ],
  });

  const staffSeedUsers = [users[0], users[1], users[2], users[3], users[4], users[5], users[6], users[7]];
  const staffProfiles = await Promise.all([
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[0].id,
        departmentId: departmentsByCode.get('HR')!.id,
        employeeCode: 'EMP-1001',
        title: 'HR Manager',
        status: 'ACTIVE',
      },
    }),
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[4].id,
        departmentId: departmentsByCode.get('HR')!.id,
        employeeCode: 'EMP-1002',
        title: 'HR Coordinator',
        status: 'ACTIVE',
      },
    }),
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[1].id,
        departmentId: departmentsByCode.get('STOCK')!.id,
        employeeCode: 'EMP-1101',
        title: 'Warehouse Supervisor',
        status: 'ACTIVE',
      },
    }),
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[5].id,
        departmentId: departmentsByCode.get('STOCK')!.id,
        employeeCode: 'EMP-1102',
        title: 'Inventory Controller',
        status: 'ACTIVE',
      },
    }),
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[2].id,
        departmentId: departmentsByCode.get('FIN')!.id,
        employeeCode: 'EMP-1201',
        title: 'Finance Analyst',
        status: 'ACTIVE',
      },
    }),
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[6].id,
        departmentId: departmentsByCode.get('FIN')!.id,
        employeeCode: 'EMP-1202',
        title: 'Finance Associate',
        status: 'ACTIVE',
      },
    }),
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[3].id,
        departmentId: departmentsByCode.get('CS')!.id,
        employeeCode: 'EMP-1301',
        title: 'Support Agent',
        status: 'ACTIVE',
      },
    }),
    prisma.staffProfile.create({
      data: {
        userId: staffSeedUsers[7].id,
        departmentId: departmentsByCode.get('CS')!.id,
        employeeCode: 'EMP-1302',
        title: 'Customer Support Specialist',
        status: 'ACTIVE',
      },
    }),
  ]);

  await prisma.staffAssignment.createMany({
    data: [
      {
        staffId: staffProfiles[0].id,
        roleId: hrManagerRole.id,
        effectiveFrom: daysAgo(180),
      },
      {
        staffId: staffProfiles[1].id,
        roleId: hrManagerRole.id,
        effectiveFrom: daysAgo(170),
      },
      {
        staffId: staffProfiles[2].id,
        roleId: warehouseSupervisorRole.id,
        effectiveFrom: daysAgo(220),
      },
      {
        staffId: staffProfiles[3].id,
        roleId: warehouseSupervisorRole.id,
        effectiveFrom: daysAgo(210),
      },
      {
        staffId: staffProfiles[4].id,
        roleId: financeApproverRole.id,
        effectiveFrom: daysAgo(200),
      },
      {
        staffId: staffProfiles[5].id,
        roleId: financeApproverRole.id,
        effectiveFrom: daysAgo(190),
      },
      {
        staffId: staffProfiles[6].id,
        roleId: supportAgentRole.id,
        effectiveFrom: daysAgo(160),
      },
      {
        staffId: staffProfiles[7].id,
        roleId: supportAgentRole.id,
        effectiveFrom: daysAgo(150),
      },
      {
        staffId: staffProfiles[6].id,
        roleId: supportAgentRole.id,
        effectiveFrom: daysAgo(320),
        effectiveTo: daysAgo(161),
      },
    ],
  });

  await prisma.staffProfile.update({
    where: { id: staffProfiles[2].id },
    data: {
      managerId: staffProfiles[0].id,
      title: 'Warehouse Operations Lead',
    },
  });
  await prisma.staffProfile.update({
    where: { id: staffProfiles[3].id },
    data: {
      managerId: staffProfiles[0].id,
      title: 'Senior Inventory Controller',
    },
  });
  await prisma.staffProfile.update({
    where: { id: staffProfiles[4].id },
    data: {
      managerId: staffProfiles[0].id,
      title: 'Senior Finance Analyst',
    },
  });
  await prisma.staffProfile.update({
    where: { id: staffProfiles[5].id },
    data: {
      managerId: staffProfiles[0].id,
    },
  });
  await prisma.staffProfile.update({
    where: { id: staffProfiles[6].id },
    data: {
      managerId: staffProfiles[0].id,
    },
  });
  await prisma.staffProfile.update({
    where: { id: staffProfiles[7].id },
    data: {
      managerId: staffProfiles[0].id,
    },
  });

  // Create sample books
  console.log('📚 Creating sample books...');
  const books = await Promise.all([
    // Fiction books
    prisma.book.create({
      data: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0-7432-7356-5',
        price: 12.99,
        stock: 25,
        description:
          'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
        rating: 4.4,
        categories: ['Fiction', 'Classic'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0-06-112008-4',
        price: 14.99,
        stock: 18,
        description:
          'A gripping tale of racial injustice and childhood innocence in the American South.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg',
        rating: 4.8,
        categories: ['Fiction', 'Classic'],
      },
    }),
    prisma.book.create({
      data: {
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-452-28423-4',
        price: 13.99,
        stock: 30,
        description:
          'A dystopian social science fiction novel about totalitarian control and surveillance.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg',
        rating: 4.6,
        categories: ['Fiction', 'Dystopian', 'Classic'],
      },
    }),

    // Science Fiction
    prisma.book.create({
      data: {
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '978-0-441-17271-9',
        price: 16.99,
        stock: 12,
        description:
          'An epic science fiction novel set on the desert planet Arrakis.',
      },
    }),
    prisma.book.create({
      data: {
        title: "The Hitchhiker's Guide to the Galaxy",
        author: 'Douglas Adams',
        isbn: '978-0-345-39180-3',
        price: 11.99,
        stock: 22,
        description:
          "A comedic science fiction series following Arthur Dent's adventures through space.",
      },
    }),

    // Programming books
    prisma.book.create({
      data: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0-13-235088-4',
        price: 42.99,
        stock: 8,
        description:
          'A handbook of agile software craftsmanship with practical advice for writing clean, maintainable code.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        isbn: '978-0-596-51774-8',
        price: 29.99,
        stock: 15,
        description:
          'A concise guide to the best features of JavaScript and how to use them effectively.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Design Patterns',
        author: 'Gang of Four',
        isbn: '978-0-201-63361-0',
        price: 54.99,
        stock: 6,
        description:
          'Elements of reusable object-oriented software design patterns.',
      },
    }),

    // Low stock books
    prisma.book.create({
      data: {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        isbn: '978-0-316-76948-0',
        price: 13.99,
        stock: 3,
        description:
          'A controversial novel about teenage rebellion and alienation.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        isbn: '978-0-06-085052-4',
        price: 14.99,
        stock: 2,
        description:
          'A dystopian novel exploring a future society driven by technology and conditioning.',
      },
    }),

    // Out of stock book
    prisma.book.create({
      data: {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        isbn: '978-0-544-00341-5',
        price: 24.99,
        stock: 0,
        description:
          'An epic high fantasy novel following the quest to destroy the One Ring.',
      },
    }),

    // More books for variety
    prisma.book.create({
      data: {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        isbn: '978-0-14-143951-8',
        price: 12.99,
        stock: 20,
        description:
          'A romantic novel about manners, upbringing, morality, and marriage in Georgian England.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Pragmatic Programmer',
        author: 'David Thomas and Andrew Hunt',
        isbn: '978-0-201-61622-4',
        price: 39.99,
        stock: 10,
        description:
          'A guide to becoming a better programmer through practical advice and techniques.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Moby Dick',
        author: 'Herman Melville',
        isbn: '978-0-14-243724-7',
        price: 15.99,
        stock: 14,
        description:
          "The epic tale of Captain Ahab's obsessive quest for revenge against the white whale.",
      },
    }),
    prisma.book.create({
      data: {
        title: "You Don't Know JS",
        author: 'Kyle Simpson',
        isbn: '978-1-491-95019-1',
        price: 34.99,
        stock: 12,
        description:
          'A deep dive into the core mechanisms of the JavaScript language.',
      },
    }),

    // More Fiction
    prisma.book.create({
      data: {
        title: "Harry Potter and the Philosopher's Stone",
        author: 'J.K. Rowling',
        isbn: '978-0-439-70818-8',
        price: 19.99,
        stock: 35,
        description:
          'The first book in the Harry Potter series about a young wizard discovering his magical heritage.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        isbn: '978-0-547-92822-7',
        price: 16.99,
        stock: 28,
        description:
          'A fantasy adventure about Bilbo Baggins and his unexpected journey.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        isbn: '978-0-307-47492-1',
        price: 15.99,
        stock: 22,
        description:
          'A mystery thriller involving secret societies and religious history.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        isbn: '978-0-06-112241-5',
        price: 14.99,
        stock: 30,
        description:
          'A philosophical novel about following your dreams and finding your destiny.',
      },
    }),

    // Science & Technology
    prisma.book.create({
      data: {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        isbn: '978-0-06-231609-7',
        price: 18.99,
        stock: 20,
        description:
          'An exploration of human history from the Stone Age to the modern age.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '978-0-553-38016-3',
        price: 17.99,
        stock: 15,
        description:
          'A landmark volume in science writing exploring cosmology and the universe.',
      },
    }),

    // More Programming
    prisma.book.create({
      data: {
        title: 'Eloquent JavaScript',
        author: 'Marijn Haverbeke',
        isbn: '978-1-59327-950-9',
        price: 32.99,
        stock: 18,
        description: 'A modern introduction to programming with JavaScript.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Python Crash Course',
        author: 'Eric Matthes',
        isbn: '978-1-59327-928-8',
        price: 39.99,
        stock: 16,
        description:
          'A hands-on, project-based introduction to programming with Python.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Art of Computer Programming',
        author: 'Donald Knuth',
        isbn: '978-0-201-89683-1',
        price: 89.99,
        stock: 5,
        description:
          'A comprehensive monograph on computer programming algorithms.',
      },
    }),

    // Mystery & Thriller
    prisma.book.create({
      data: {
        title: 'Gone Girl',
        author: 'Gillian Flynn',
        isbn: '978-0-307-58836-4',
        price: 15.99,
        stock: 24,
        description:
          'A psychological thriller about a marriage gone terribly wrong.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Girl with the Dragon Tattoo',
        author: 'Stieg Larsson',
        isbn: '978-0-307-45454-1',
        price: 16.99,
        stock: 19,
        description: 'A gripping mystery thriller set in Sweden.',
      },
    }),

    // Self-Help & Business
    prisma.book.create({
      data: {
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '978-0-7352-1129-2',
        price: 16.99,
        stock: 40,
        description:
          'An easy and proven way to build good habits and break bad ones.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        isbn: '978-0-307-88791-7',
        price: 26.99,
        stock: 14,
        description:
          "How today's entrepreneurs use continuous innovation to create radically successful businesses.",
      },
    }),
    prisma.book.create({
      data: {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '978-0-374-53355-7',
        price: 18.99,
        stock: 17,
        description:
          'A groundbreaking tour of the mind explaining the two systems that drive the way we think.',
      },
    }),

    // Fantasy
    prisma.book.create({
      data: {
        title: 'A Game of Thrones',
        author: 'George R.R. Martin',
        isbn: '978-0-553-10354-0',
        price: 19.99,
        stock: 26,
        description:
          'The first book in A Song of Ice and Fire series, an epic fantasy saga.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        isbn: '978-0-7564-0407-9',
        price: 17.99,
        stock: 21,
        description:
          'The first book in The Kingkiller Chronicle, a fantasy adventure.',
      },
    }),

    // More Classics
    prisma.book.create({
      data: {
        title: 'Crime and Punishment',
        author: 'Fyodor Dostoevsky',
        isbn: '978-0-14-310575-5',
        price: 14.99,
        stock: 11,
        description:
          'A psychological drama about morality, guilt, and redemption.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Wuthering Heights',
        author: 'Emily Brontë',
        isbn: '978-0-14-143955-6',
        price: 12.99,
        stock: 13,
        description: 'A tale of passion and revenge on the Yorkshire moors.',
      },
    }),

    // Low stock items
    prisma.book.create({
      data: {
        title: 'The Road',
        author: 'Cormac McCarthy',
        isbn: '978-0-307-38789-9',
        price: 15.99,
        stock: 4,
        description:
          "A post-apocalyptic novel about a father and son's journey.",
      },
    }),
    prisma.book.create({
      data: {
        title: 'Life of Pi',
        author: 'Yann Martel',
        isbn: '978-0-15-602732-2',
        price: 14.99,
        stock: 3,
        description:
          'A philosophical adventure novel about survival and faith.',
      },
    }),

    // Additional books
    prisma.book.create({
      data: {
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        isbn: '978-1-250-30811-5',
        price: 16.99,
        stock: 18,
        description:
          'A psychological thriller about a woman who stops speaking after a shocking act.',
        categories: ['Mystery', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Educated',
        author: 'Tara Westover',
        isbn: '978-0-399-59050-4',
        price: 17.99,
        stock: 16,
        description:
          'A memoir about a woman who grows up in a survivalist family and pursues education.',
        categories: ['Biography', 'Memoir'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Martian',
        author: 'Andy Weir',
        isbn: '978-0-8041-3902-1',
        price: 15.99,
        stock: 20,
        description:
          'An astronaut stranded on Mars fights to survive with science and ingenuity.',
        categories: ['Science Fiction', 'Adventure'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        isbn: '978-0-593-13520-4',
        price: 19.99,
        stock: 14,
        description: 'A lone astronaut must save Earth from a cosmic threat.',
        categories: ['Science Fiction', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Circe',
        author: 'Madeline Miller',
        isbn: '978-0-316-55256-7',
        price: 16.99,
        stock: 17,
        description: 'A retelling of the life of the Greek goddess Circe.',
        categories: ['Fantasy', 'Mythology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Night Circus',
        author: 'Erin Morgenstern',
        isbn: '978-0-307-74783-9',
        price: 15.99,
        stock: 19,
        description:
          'A magical competition between two illusionists set in a mysterious circus.',
        categories: ['Fantasy', 'Romance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Normal People',
        author: 'Sally Rooney',
        isbn: '978-1-9821-4902-6',
        price: 14.99,
        stock: 21,
        description:
          'A nuanced story of love and friendship between two young people.',
        categories: ['Fiction', 'Romance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        isbn: '978-0-525-55947-4',
        price: 16.99,
        stock: 22,
        description:
          'A woman explores alternate lives in a library between life and death.',
        categories: ['Fiction', 'Fantasy'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Becoming',
        author: 'Michelle Obama',
        isbn: '978-1-5247-6313-8',
        price: 18.99,
        stock: 13,
        description: 'A memoir by the former First Lady of the United States.',
        categories: ['Biography', 'Memoir'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Subtle Art of Not Giving a F*ck',
        author: 'Mark Manson',
        isbn: '978-0-06-245771-4',
        price: 15.99,
        stock: 24,
        description: 'A counterintuitive approach to living a good life.',
        categories: ['Self-Help', 'Psychology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Deep Work',
        author: 'Cal Newport',
        isbn: '978-1-4555-4484-5',
        price: 16.99,
        stock: 12,
        description: 'Rules for focused success in a distracted world.',
        categories: ['Business', 'Productivity'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The 7 Habits of Highly Effective People',
        author: 'Stephen R. Covey',
        isbn: '978-1-9821-3583-8',
        price: 17.99,
        stock: 18,
        description:
          'A classic guide to personal and professional effectiveness.',
        categories: ['Self-Help', 'Business'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Rich Dad Poor Dad',
        author: 'Robert T. Kiyosaki',
        isbn: '978-1-61268-019-4',
        price: 14.99,
        stock: 20,
        description: 'Lessons on money and investing from two father figures.',
        categories: ['Business', 'Finance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        isbn: '978-0-8129-8160-5',
        price: 16.99,
        stock: 17,
        description: 'How habits work and how to change them.',
        categories: ['Psychology', 'Self-Help'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Four Agreements',
        author: 'Don Miguel Ruiz',
        isbn: '978-1-879842-33-6',
        price: 11.99,
        stock: 23,
        description: 'A practical guide to personal freedom.',
        categories: ['Self-Help', 'Spirituality'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Body Keeps the Score',
        author: 'Bessel van der Kolk',
        isbn: '978-0-670-78593-3',
        price: 19.99,
        stock: 14,
        description: 'Understanding trauma and healing through mind and body.',
        categories: ['Psychology', 'Health'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        isbn: '978-0-85719-768-9',
        price: 15.99,
        stock: 25,
        description: 'Timeless lessons on wealth, greed, and happiness.',
        categories: ['Business', 'Finance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Song of Achilles',
        author: 'Madeline Miller',
        isbn: '978-0-06-206062-4',
        price: 15.99,
        stock: 18,
        description:
          'A retelling of the Trojan War through the eyes of Patroclus.',
        categories: ['Fantasy', 'Mythology'],
      },
    }),
    prisma.book.create({
      data: {
        title: "The Handmaid's Tale",
        author: 'Margaret Atwood',
        isbn: '978-0-385-49081-8',
        price: 14.99,
        stock: 20,
        description:
          "A dystopian novel about a theocratic society and a woman's resistance.",
        categories: ['Fiction', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Road to Wigan Pier',
        author: 'George Orwell',
        isbn: '978-0-15-676750-1',
        price: 13.99,
        stock: 10,
        description: 'A social study of the working class in Northern England.',
        categories: ['History', 'Nonfiction'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Outsiders',
        author: 'S.E. Hinton',
        isbn: '978-0-14-038572-3',
        price: 11.99,
        stock: 22,
        description: 'A coming-of-age story about rival teen groups.',
        categories: ['Fiction', 'Young Adult'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Maze Runner',
        author: 'James Dashner',
        isbn: '978-0-385-73794-4',
        price: 12.99,
        stock: 21,
        description: 'Teens wake up in a maze and must solve its mystery.',
        categories: ['Young Adult', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Hunger Games',
        author: 'Suzanne Collins',
        isbn: '978-0-439-02348-1',
        price: 12.99,
        stock: 27,
        description: 'A girl fights for survival in a televised death match.',
        categories: ['Young Adult', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Giver',
        author: 'Lois Lowry',
        isbn: '978-0-544-33732-9',
        price: 11.99,
        stock: 19,
        description:
          'A boy discovers the dark secrets of his seemingly perfect society.',
        categories: ['Young Adult', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'A Man Called Ove',
        author: 'Fredrik Backman',
        isbn: '978-1-4767-3154-3',
        price: 14.99,
        stock: 18,
        description:
          "A grumpy man's life changes through unexpected friendships.",
        categories: ['Fiction', 'Contemporary'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Kite Runner',
        author: 'Khaled Hosseini',
        isbn: '978-1-59448-000-3',
        price: 15.99,
        stock: 16,
        description:
          'A story of friendship, betrayal, and redemption in Afghanistan.',
        categories: ['Fiction', 'Historical'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Book Thief',
        author: 'Markus Zusak',
        isbn: '978-0-375-84220-7',
        price: 14.99,
        stock: 18,
        description: 'A young girl in Nazi Germany finds solace in books.',
        categories: ['Historical', 'Young Adult'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Girl on the Train',
        author: 'Paula Hawkins',
        isbn: '978-1-59463-366-9',
        price: 14.99,
        stock: 20,
        description:
          'A psychological thriller about a woman entangled in a missing-persons case.',
        categories: ['Mystery', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Big Little Lies',
        author: 'Liane Moriarty',
        isbn: '978-0-399-16810-9',
        price: 15.99,
        stock: 19,
        description: 'A murder mystery within a group of suburban mothers.',
        categories: ['Fiction', 'Mystery'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Immortal Life of Henrietta Lacks',
        author: 'Rebecca Skloot',
        isbn: '978-1-4000-5218-9',
        price: 16.99,
        stock: 14,
        description: 'The story of the woman behind the HeLa cell line.',
        categories: ['Biography', 'Science'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Quiet',
        author: 'Susan Cain',
        isbn: '978-0-307-35215-6',
        price: 15.99,
        stock: 18,
        description:
          "The power of introverts in a world that can't stop talking.",
        categories: ['Psychology', 'Self-Help'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Born a Crime',
        author: 'Trevor Noah',
        isbn: '978-0-399-58817-4',
        price: 16.99,
        stock: 17,
        description: 'A memoir about growing up in apartheid South Africa.',
        categories: ['Biography', 'Memoir'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Immortal Irishman',
        author: 'Timothy Egan',
        isbn: '978-0-544-37217-7',
        price: 17.99,
        stock: 10,
        description: 'The saga of Thomas Meagher and the Irish revolution.',
        categories: ['History', 'Biography'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Wright Brothers',
        author: 'David McCullough',
        isbn: '978-1-4767-2077-6',
        price: 18.99,
        stock: 12,
        description: 'A biography of the pioneers of flight.',
        categories: ['History', 'Biography'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Thinking in Systems',
        author: 'Donella H. Meadows',
        isbn: '978-1-60358-055-7',
        price: 21.99,
        stock: 9,
        description: 'A primer on systems thinking and analysis.',
        categories: ['Science', 'Business'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        isbn: '978-0-465-05065-9',
        price: 22.99,
        stock: 11,
        description: 'A classic on human-centered design.',
        categories: ['Design', 'Business'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Refactoring',
        author: 'Martin Fowler',
        isbn: '978-0-13-475759-9',
        price: 49.99,
        stock: 7,
        description: 'Improving the design of existing code.',
        categories: ['Programming', 'Technology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Effective TypeScript',
        author: 'Dan Vanderkam',
        isbn: '978-1-4920-5037-3',
        price: 39.99,
        stock: 9,
        description: '62 specific ways to improve your TypeScript.',
        categories: ['Programming', 'Technology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Grit',
        author: 'Angela Duckworth',
        isbn: '978-1-5011-1710-1',
        price: 16.99,
        stock: 18,
        description: 'The power of passion and perseverance.',
        categories: ['Psychology', 'Self-Help'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Immortal Life of Henrietta Lacks: Young Readers Edition',
        author: 'Rebecca Skloot',
        isbn: '978-0-385-37492-7',
        price: 13.99,
        stock: 15,
        description: 'A young readers edition of the story behind HeLa cells.',
        categories: ['Science', 'Young Adult'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Wind-Up Bird Chronicle',
        author: 'Haruki Murakami',
        isbn: '978-0-679-77276-5',
        price: 17.99,
        stock: 12,
        description:
          'A surreal mystery involving a missing wife and a strange well.',
        categories: ['Fiction', 'Mystery'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Norwegian Wood',
        author: 'Haruki Murakami',
        isbn: '978-0-375-70402-4',
        price: 14.99,
        stock: 19,
        description: 'A nostalgic story of love and loss in 1960s Tokyo.',
        categories: ['Fiction', 'Romance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Three-Body Problem',
        author: 'Liu Cixin',
        isbn: '978-0-7653-7055-3',
        price: 18.99,
        stock: 13,
        description: "Humanity's first contact with an alien civilization.",
        categories: ['Science Fiction', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Fifth Season',
        author: 'N.K. Jemisin',
        isbn: '978-0-316-22929-2',
        price: 16.99,
        stock: 14,
        description: 'A world-ending catastrophe and those who survive it.',
        categories: ['Fantasy', 'Science Fiction'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Ocean at the End of the Lane',
        author: 'Neil Gaiman',
        isbn: '978-0-06-225565-5',
        price: 14.99,
        stock: 20,
        description: 'A man revisits his childhood and a mysterious girl.',
        categories: ['Fantasy', 'Fiction'],
      },
    }),
  ]);

  // Ensure all books have cover images
  console.log('🖼️  Ensuring cover images...');
  const booksNeedingCovers = await prisma.book.findMany({
    where: { OR: [{ coverImage: null }, { coverImage: '' }] },
    select: { id: true, isbn: true },
  });
  await Promise.all(
    booksNeedingCovers.map((book) =>
      prisma.book.update({
        where: { id: book.id },
        data: { coverImage: coverFromIsbn(book.isbn) },
      }),
    ),
  );

  // Ensure all books have genre tags
  console.log('🏷️  Ensuring genre tags...');
  const booksForGenres = await prisma.book.findMany({
    select: { id: true, categories: true, genres: true },
  });
  await Promise.all(
    booksForGenres.map((book) => {
      if (book.genres.length > 0) {
        return Promise.resolve(null);
      }
      const fallbackGenres = Array.from(new Set(book.categories)).slice(0, 3);
      return prisma.book.update({
        where: { id: book.id },
        data: {
          genres: fallbackGenres.length > 0 ? fallbackGenres : ['General'],
        },
      });
    }),
  );

  // Ensure there are books by the same authors
  const booksByAuthor = await prisma.book.groupBy({
    by: ['author'],
    _count: { _all: true },
  });
  const repeatedAuthors = booksByAuthor.filter((entry) => entry._count._all > 1);
  if (repeatedAuthors.length === 0) {
    throw new Error('Seed invariant failed: no author has multiple books');
  }

  // Create some sample cart items for users
  console.log('🛒 Creating sample cart items...');
  await Promise.all([
    prisma.cartItem.create({
      data: {
        userId: users[0].id,
        bookId: books[0].id,
        quantity: 2,
      },
    }),
    prisma.cartItem.create({
      data: {
        userId: users[0].id,
        bookId: books[5].id,
        quantity: 1,
      },
    }),
    prisma.cartItem.create({
      data: {
        userId: users[1].id,
        bookId: books[2].id,
        quantity: 1,
      },
    }),
    prisma.cartItem.create({
      data: {
        userId: users[1].id,
        bookId: books[6].id,
        quantity: 1,
      },
    }),
  ]);

  // Create reviews and update book ratings
  console.log('⭐ Creating reviews...');
  const reviewComments = [
    'Loved the pacing and character development.',
    'Great read, would recommend.',
    'Solid book with a few slow parts.',
    'Interesting ideas and engaging writing.',
    'Well written and easy to follow.',
    'Enjoyed it more than I expected.',
    'A bit long, but worth it.',
    'Great for fans of the genre.',
    'Strong start and satisfying ending.',
    'Good value for the price.',
  ];

  // Guarantee every book has at least one review
  const baseReviewCreates = books.map((book, index) =>
    prisma.review.create({
      data: {
        userId: users[index % users.length].id,
        bookId: book.id,
        rating: 3 + (index % 3), // 3-5
        comment: reviewComments[index % reviewComments.length],
      },
    }),
  );

  // Add extra reviews for richer rating distribution
  const bonusReviewCreates = users.map((user, index) =>
    prisma.review.create({
      data: {
        userId: user.id,
        bookId: books[(index * 5 + 3) % books.length].id,
        rating: 4 + (index % 2), // 4-5
        comment: reviewComments[(index + 4) % reviewComments.length],
      },
    }),
  );

  await Promise.all([...baseReviewCreates, ...bonusReviewCreates]);
  const totalReviewsCreated = baseReviewCreates.length + bonusReviewCreates.length;

  const ratingAverages = await prisma.review.groupBy({
    by: ['bookId'],
    _avg: { rating: true },
  });
  await Promise.all(
    ratingAverages.map((entry) =>
      prisma.book.update({
        where: { id: entry.bookId },
        data: { rating: entry._avg.rating ?? 0 },
      }),
    ),
  );

  // Verify quality invariants for testing data
  const booksMissingGenres = await prisma.book.count({
    where: { genres: { isEmpty: true } },
  });
  const booksMissingReviews = await prisma.book.count({
    where: { reviews: { none: {} } },
  });
  const booksMissingRatings = await prisma.book.count({
    where: {
      OR: [{ rating: null }, { rating: { lte: 0 } }],
    },
  });

  if (booksMissingGenres > 0 || booksMissingReviews > 0 || booksMissingRatings > 0) {
    throw new Error(
      `Seed invariant failed: missing genres=${booksMissingGenres}, missing reviews=${booksMissingReviews}, missing ratings=${booksMissingRatings}`,
    );
  }

  // Create sample orders for admin transaction UIs
  console.log('📦 Creating sample orders...');
  const paymentProviders = ['KPAY', 'WAVEPAY', 'MPU'] as const;
  const orderStatuses = ['COMPLETED', 'PENDING', 'CANCELLED'] as const;
  const cityStateCountry = [
    { city: 'San Francisco', state: 'CA', country: 'USA', zip: '94105' },
    { city: 'New York', state: 'NY', country: 'USA', zip: '10001' },
    { city: 'Austin', state: 'TX', country: 'USA', zip: '73301' },
    { city: 'Seattle', state: 'WA', country: 'USA', zip: '98101' },
    { city: 'Chicago', state: 'IL', country: 'USA', zip: '60601' },
    { city: 'Boston', state: 'MA', country: 'USA', zip: '02108' },
  ];

  const createdOrders: Array<{ id: string; status: string; userId: string }> = [];
  let createdOrderItemsCount = 0;
  for (let i = 0; i < 16; i += 1) {
    const buyer = users[i % users.length];
    const location = cityStateCountry[i % cityStateCountry.length];
    const status = orderStatuses[i % orderStatuses.length];
    const itemCount = 1 + (i % 3);
    const pickedBooks = Array.from({ length: itemCount }, (_, idx) => books[(i * 3 + idx) % books.length]);
    const quantities = pickedBooks.map((_book, idx) => ((i + idx) % 2) + 1);
    const totalPrice = pickedBooks.reduce(
      (sum, book, idx) => sum + Number(book.price) * quantities[idx],
      0,
    );

    const createdOrder = await prisma.order.create({
      data: {
        userId: buyer.id,
        status,
        subtotalPrice: totalPrice,
        discountAmount: 0,
        totalPrice,
        shippingFullName: buyer.name,
        shippingEmail: buyer.email,
        shippingPhone: `+1-555-01${String(i).padStart(2, '0')}`,
        shippingAddress: `${100 + i} Market Street`,
        shippingCity: location.city,
        shippingState: location.state,
        shippingZipCode: location.zip,
        shippingCountry: location.country,
        paymentProvider: paymentProviders[i % paymentProviders.length],
        paymentReceiptUrl: `https://example.com/receipts/order-${i + 1}.png`,
        createdAt: daysAgo(45 - i, 9 + (i % 7)),
      },
    });

    await prisma.orderItem.createMany({
      data: pickedBooks.map((book, idx) => ({
        orderId: createdOrder.id,
        bookId: book.id,
        quantity: quantities[idx],
        price: book.price,
      })),
    });

    createdOrderItemsCount += pickedBooks.length;
    createdOrders.push({ id: createdOrder.id, status, userId: buyer.id });
  }

  // Create warehouses + stock distribution + transfers/alerts
  console.log('🏬 Creating warehouse demo data...');
  const warehouseSeeds = [
    {
      code: 'WH-SFO-01',
      name: 'Bay Area Central Warehouse',
      city: 'San Francisco',
      state: 'CA',
      address: '200 Harbor Way, San Francisco, CA',
      isActive: true,
    },
    {
      code: 'WH-NYC-01',
      name: 'Northeast Fulfillment Hub',
      city: 'New York',
      state: 'NY',
      address: '85 Liberty Ave, New York, NY',
      isActive: true,
    },
    {
      code: 'WH-TX-01',
      name: 'Southwest Distribution Center',
      city: 'Austin',
      state: 'TX',
      address: '410 Industrial Dr, Austin, TX',
      isActive: true,
    },
    {
      code: 'WH-SEA-01',
      name: 'Northwest Overflow Storage',
      city: 'Seattle',
      state: 'WA',
      address: '19 Rainier Park, Seattle, WA',
      isActive: false,
    },
  ];

  const warehouses = await Promise.all(
    warehouseSeeds.map((warehouse) =>
      prisma.warehouse.upsert({
        where: { code: warehouse.code },
        update: warehouse,
        create: warehouse,
      }),
    ),
  );

  const warehouseStockRows: Array<{
    warehouseId: string;
    bookId: string;
    stock: number;
    lowStockThreshold: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  for (let i = 0; i < 32; i += 1) {
    const primaryWarehouse = warehouses[i % warehouses.length];
    const book = books[i % books.length];
    warehouseStockRows.push({
      warehouseId: primaryWarehouse.id,
      bookId: book.id,
      stock: (i % 6 === 0 ? 2 : 8 + (i % 35)),
      lowStockThreshold: 5 + (i % 4),
      createdAt: daysAgo(60 - i, 8),
      updatedAt: daysAgo((60 - i) % 30, 12),
    });

    if (i % 2 === 0) {
      const secondaryWarehouse = warehouses[(i + 1) % warehouses.length];
      warehouseStockRows.push({
        warehouseId: secondaryWarehouse.id,
        bookId: book.id,
        stock: 3 + (i % 18),
        lowStockThreshold: 4 + (i % 3),
        createdAt: daysAgo(55 - i, 9),
        updatedAt: daysAgo((55 - i) % 28, 14),
      });
    }
  }

  await prisma.warehouseStock.createMany({
    data: warehouseStockRows,
    skipDuplicates: true,
  });

  const transferInputs = Array.from({ length: 12 }, (_, i) => {
    const fromWarehouse = warehouses[i % warehouses.length];
    const toWarehouse = warehouses[(i + 1) % warehouses.length];
    const transferBook = books[(i * 4 + 2) % books.length];
    return {
      bookId: transferBook.id,
      fromWarehouseId: fromWarehouse.id,
      toWarehouseId: toWarehouse.id,
      quantity: 2 + (i % 7),
      note: i % 3 === 0 ? 'Rebalance high-demand titles' : 'Routine transfer',
      createdByUserId: staffSeedUsers[1].id,
      createdAt: daysAgo(24 - i, 10 + (i % 5)),
    };
  });

  const createdTransfers = await Promise.all(
    transferInputs.map((input) =>
      prisma.warehouseTransfer.create({
        data: input,
      }),
    ),
  );

  const alertInputs = Array.from({ length: 10 }, (_, i) => {
    const warehouse = warehouses[i % warehouses.length];
    const alertBook = books[(i * 5 + 1) % books.length];
    const isResolved = i % 4 === 0;
    return {
      warehouseId: warehouse.id,
      bookId: alertBook.id,
      stock: i % 3,
      threshold: 5 + (i % 3),
      status: isResolved ? 'RESOLVED' : 'OPEN',
      createdAt: daysAgo(20 - i, 8 + (i % 4)),
      resolvedAt: isResolved ? daysAgo(18 - i, 15) : null,
    } as const;
  });

  await prisma.warehouseAlert.createMany({
    data: alertInputs,
  });

  const vendorSeeds = [
    {
      code: 'PENGUIN-RH',
      name: 'Penguin Random House Distribution',
      contactName: 'B2B Supply Team',
      email: 'supply@penguinrh.example',
      phone: '+1-212-555-0190',
      address: '1745 Broadway, New York, NY',
      isActive: true,
    },
    {
      code: 'HARPERCOLLINS',
      name: 'HarperCollins Wholesale',
      contactName: 'Wholesale Desk',
      email: 'wholesale@harpercollins.example',
      phone: '+1-646-555-0123',
      address: '195 Broadway, New York, NY',
      isActive: true,
    },
    {
      code: 'SIMON-SCHUSTER',
      name: 'Simon & Schuster Trade Supply',
      contactName: 'Vendor Operations',
      email: 'ops@simon.example',
      phone: '+1-917-555-0188',
      address: '1230 Avenue of the Americas, New York, NY',
      isActive: true,
    },
  ];

  const vendors = await Promise.all(
    vendorSeeds.map((vendor) =>
      prisma.vendor.upsert({
        where: { code: vendor.code },
        update: vendor,
        create: vendor,
      }),
    ),
  );

  const purchaseRequestSeeds = Array.from({ length: 6 }, (_, i) => {
    const warehouse = warehouses[i % warehouses.length];
    const book = books[(i * 3 + 7) % books.length];
    const qty = 8 + (i * 3);
    const estimatedCost = Number(book.price || 12) * qty;
    const approved = i % 3 !== 1;
    const completed = i % 3 === 0;
    return {
      bookId: book.id,
      warehouseId: warehouse.id,
      requestedByUserId: staffSeedUsers[1].id,
      quantity: qty,
      estimatedCost,
      approvedQuantity: approved ? qty : null,
      approvedCost: approved ? estimatedCost : null,
      reviewNote: approved ? 'Approved for replenishment.' : 'Waiting for finance review.',
      status: completed
        ? 'COMPLETED'
        : approved
          ? 'APPROVED'
          : 'PENDING_APPROVAL',
      approvedByUserId: approved ? staffSeedUsers[6].id : null,
      approvedAt: approved ? daysAgo(6 - i, 13) : null,
      completedAt: completed ? daysAgo(4 - i, 16) : null,
      createdAt: daysAgo(9 - i, 9 + i),
      updatedAt: daysAgo(8 - i, 11 + i),
    } as const;
  });

  const purchaseRequests = await Promise.all(
    purchaseRequestSeeds.map((request) =>
      prisma.purchaseRequest.create({
        data: request,
      }),
    ),
  );

  for (let i = 0; i < purchaseRequests.length; i += 1) {
    const request = purchaseRequests[i];
    if (request.status === 'PENDING_APPROVAL') continue;

    const vendor = vendors[i % vendors.length];
    const order = await prisma.purchaseOrder.create({
      data: {
        vendorId: vendor.id,
        warehouseId: request.warehouseId,
        status: request.status === 'COMPLETED' ? 'CLOSED' : 'SENT',
        createdByUserId: request.requestedByUserId,
        approvedByUserId: request.approvedByUserId,
        expectedAt: daysAgo(-(i + 2), 12),
        sentAt: daysAgo(5 - i, 10),
        receivedAt: request.status === 'COMPLETED' ? daysAgo(3 - i, 17) : null,
        notes: 'Generated from approved purchase request seed.',
        totalCost: request.approvedCost ?? request.estimatedCost,
        items: {
          create: {
            bookId: request.bookId,
            orderedQuantity: request.approvedQuantity ?? request.quantity,
            receivedQuantity:
              request.status === 'COMPLETED'
                ? (request.approvedQuantity ?? request.quantity)
                : 0,
            unitCost:
              request.approvedQuantity && request.approvedCost
                ? Number(request.approvedCost) / request.approvedQuantity
                : null,
          },
        },
      },
    });

    await prisma.purchaseRequest.update({
      where: { id: request.id },
      data: { purchaseOrderId: order.id },
    });
  }

  // Create staff tasks/history for management dashboards
  console.log('🧾 Creating staff task and audit history...');
  const taskTypes = ['ORDER_REVIEW', 'STOCK_CHECK', 'INQUIRY_REPLY', 'PAYOUT_APPROVAL', 'ROLE_AUDIT'];
  const taskStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'] as const;
  const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

  const taskInputs = Array.from({ length: 22 }, (_, i) => {
    const staff = staffProfiles[i % staffProfiles.length];
    const createdAt = daysAgo(28 - i, 9 + (i % 6));
    const status = taskStatuses[i % taskStatuses.length];
    const completedAt = status === 'COMPLETED' ? daysAgo(27 - i, 18) : null;
    return {
      staffId: staff.id,
      type: taskTypes[i % taskTypes.length],
      status,
      priority: taskPriorities[i % taskPriorities.length],
      metadata: {
        category: i % 2 === 0 ? 'Operations' : 'Governance',
        source: i % 3 === 0 ? 'System' : 'Manager',
        deadline: daysAgo(-(i % 9), 17).toISOString(),
      },
      createdAt,
      completedAt,
    };
  });

  await prisma.staffTask.createMany({
    data: taskInputs,
  });

  const auditInputs = [
    ...createdOrders.slice(0, 8).map((order, i) => ({
      actorUserId: staffSeedUsers[2].id,
      action: 'ORDER_STATUS_REVIEWED',
      resource: 'Order',
      resourceId: order.id,
      changes: {
        status: order.status,
        decision: i % 2 === 0 ? 'approved' : 'flagged',
      },
      createdAt: daysAgo(14 - i, 11),
    })),
    ...createdTransfers.slice(0, 8).map((transfer, i) => ({
      actorUserId: staffSeedUsers[1].id,
      action: 'WAREHOUSE_TRANSFER_CREATED',
      resource: 'WarehouseTransfer',
      resourceId: transfer.id,
      changes: {
        quantity: transfer.quantity,
        note: transfer.note,
      },
      createdAt: daysAgo(12 - i, 13),
    })),
    ...staffProfiles.map((profile, i) => ({
      actorUserId: staffSeedUsers[0].id,
      action: 'STAFF_PROFILE_UPDATED',
      resource: 'StaffProfile',
      resourceId: profile.id,
      changes: {
        title: profile.title,
        status: profile.status,
      },
      createdAt: daysAgo(10 - i, 15),
    })),
    {
      actorUserId: adminUser.id,
      action: 'PERMISSION_MATRIX_SYNCED',
      resource: 'StaffRolePermission',
      resourceId: hrManagerRole.id,
      changes: {
        scope: 'DEPARTMENT',
        version: 1,
      },
      createdAt: daysAgo(3, 16),
    },
  ];

  await prisma.staffAuditLog.createMany({
    data: auditInputs,
  });

  console.log('📨 Creating inquiries, thread messages, notes, and inquiry audits...');
  const supportDepartment = departmentsByCode.get('CS')!;
  const financeDepartment = departmentsByCode.get('FIN')!;
  const warehouseDepartment = departmentsByCode.get('STOCK')!;

  const inquiryInputs = [
    {
      type: 'payment' as const,
      subject: 'Payment posted but order still pending',
      priority: 'HIGH' as const,
      createdByUserId: users[4].id,
      departmentId: supportDepartment.id,
      status: 'OPEN' as const,
      createdAt: daysAgo(8, 9),
    },
    {
      type: 'stock' as const,
      subject: 'Missing item in package',
      priority: 'URGENT' as const,
      createdByUserId: users[5].id,
      departmentId: supportDepartment.id,
      status: 'ASSIGNED' as const,
      assignedToStaffId: staffProfiles[3].id,
      createdAt: daysAgo(6, 11),
    },
    {
      type: 'order' as const,
      subject: 'Address update request for shipped order',
      priority: 'MEDIUM' as const,
      createdByUserId: users[6].id,
      departmentId: financeDepartment.id,
      status: 'IN_PROGRESS' as const,
      assignedToStaffId: staffProfiles[2].id,
      createdAt: daysAgo(5, 10),
    },
    {
      type: 'legal' as const,
      subject: 'Invoice and tax compliance confirmation',
      priority: 'LOW' as const,
      createdByUserId: users[7].id,
      departmentId: financeDepartment.id,
      status: 'ESCALATED' as const,
      createdAt: daysAgo(4, 13),
    },
    {
      type: 'stock' as const,
      subject: 'Book arrived damaged on delivery',
      priority: 'HIGH' as const,
      createdByUserId: users[8].id,
      departmentId: warehouseDepartment.id,
      status: 'RESOLVED' as const,
      assignedToStaffId: staffProfiles[1].id,
      createdAt: daysAgo(3, 12),
    },
    {
      type: 'other' as const,
      subject: 'Need duplicate receipt copy',
      priority: 'LOW' as const,
      createdByUserId: users[9].id,
      departmentId: supportDepartment.id,
      status: 'CLOSED' as const,
      createdAt: daysAgo(2, 14),
    },
  ];

  const createdInquiries = await Promise.all(
    inquiryInputs.map((input, idx) =>
      prisma.inquiry.create({
        data: {
          ...input,
          updatedAt: daysAgo(Math.max(0, 8 - idx), 18),
        },
      }),
    ),
  );

  await prisma.inquiryMessage.createMany({
    data: createdInquiries.flatMap((inquiry, i) => [
      {
        inquiryId: inquiry.id,
        senderId: inquiry.createdByUserId,
        senderType: 'USER',
        message: `Customer message: ${inquiry.subject}`,
        createdAt: daysAgo(8 - i, 9),
      },
      {
        inquiryId: inquiry.id,
        senderId: staffSeedUsers[i % staffSeedUsers.length].id,
        senderType: 'STAFF',
        message: i % 2 === 0 ? 'We are reviewing your case now.' : 'Thanks, we have escalated this internally.',
        createdAt: daysAgo(Math.max(0, 7 - i), 16),
      },
    ]),
  });

  await prisma.inquiryInternalNote.createMany({
    data: createdInquiries.slice(0, 5).map((inquiry, i) => ({
      inquiryId: inquiry.id,
      staffId: staffProfiles[i % staffProfiles.length].id,
      note: i % 2 === 0 ? 'Verify order timeline before response.' : 'Needs cross-team follow-up.',
      createdAt: daysAgo(Math.max(0, 6 - i), 17),
    })),
  });

  await prisma.inquiryAudit.createMany({
    data: createdInquiries.flatMap((inquiry, i) => {
      const base: Array<{
        inquiryId: string;
        action: 'CREATED' | 'ASSIGNED' | 'ESCALATED' | 'CLOSED';
        fromDepartmentId: string | null;
        toDepartmentId: string | null;
        performedByUserId: string;
        createdAt: Date;
      }> = [
        {
          inquiryId: inquiry.id,
          action: 'CREATED' as const,
          fromDepartmentId: null,
          toDepartmentId: inquiry.departmentId,
          performedByUserId: inquiry.createdByUserId,
          createdAt: daysAgo(8 - i, 9),
        },
      ];

      if (i === 1 || i === 4) {
        base.push({
          inquiryId: inquiry.id,
          action: 'ASSIGNED',
          fromDepartmentId: inquiry.departmentId,
          toDepartmentId: inquiry.departmentId,
          performedByUserId: staffSeedUsers[0].id,
          createdAt: daysAgo(7 - i, 11),
        });
      }
      if (i === 3) {
        base.push({
          inquiryId: inquiry.id,
          action: 'ESCALATED',
          fromDepartmentId: supportDepartment.id,
          toDepartmentId: financeDepartment.id,
          performedByUserId: staffSeedUsers[3].id,
          createdAt: daysAgo(3, 15),
        });
      }
      if (i === 5) {
        base.push({
          inquiryId: inquiry.id,
          action: 'CLOSED',
          fromDepartmentId: inquiry.departmentId,
          toDepartmentId: inquiry.departmentId,
          performedByUserId: staffSeedUsers[0].id,
          createdAt: daysAgo(1, 17),
        });
      }
      return base;
    }),
  });

  console.log('🏪 Creating stores and in-store inventory...');
  const storeSeeds = [
    {
      code: 'STORE-SF-01',
      name: 'Downtown San Francisco Books',
      city: 'San Francisco',
      state: 'CA',
      address: '45 Mission St, San Francisco, CA',
      phone: '+1-415-555-0101',
      email: 'sf-store@bookstore.example',
      isActive: true,
    },
    {
      code: 'STORE-NY-01',
      name: 'Manhattan Reading Room',
      city: 'New York',
      state: 'NY',
      address: '220 W 14th St, New York, NY',
      phone: '+1-212-555-0192',
      email: 'ny-store@bookstore.example',
      isActive: true,
    },
    {
      code: 'STORE-AUS-01',
      name: 'Austin Book Loft',
      city: 'Austin',
      state: 'TX',
      address: '118 Congress Ave, Austin, TX',
      phone: '+1-512-555-0184',
      email: 'austin-store@bookstore.example',
      isActive: true,
    },
  ];

  const stores = await Promise.all(
    storeSeeds.map((store) =>
      prisma.store.upsert({
        where: { code: store.code },
        update: store,
        create: store,
      }),
    ),
  );

  const storeStockRows = Array.from({ length: 24 }, (_, i) => ({
    storeId: stores[i % stores.length].id,
    bookId: books[(i * 2 + 1) % books.length].id,
    stock: 1 + (i % 11),
    lowStockThreshold: 2 + (i % 4),
    createdAt: daysAgo(18 - (i % 10), 10),
    updatedAt: daysAgo(i % 7, 13),
  }));
  await prisma.storeStock.createMany({
    data: storeStockRows,
    skipDuplicates: true,
  });

  const storeTransfers = await Promise.all(
    Array.from({ length: 9 }, (_, i) =>
      prisma.storeTransfer.create({
        data: {
          bookId: books[(i * 3 + 4) % books.length].id,
          fromWarehouseId: warehouses[i % warehouses.length].id,
          toStoreId: stores[i % stores.length].id,
          quantity: 2 + (i % 5),
          note: i % 2 === 0 ? 'Initial shelf fill for store pickup' : 'Weekly replenishment',
          createdByUserId: staffSeedUsers[1].id,
          createdAt: daysAgo(14 - i, 11 + (i % 4)),
        },
      }),
    ),
  );

  console.log('🏠 Creating customer saved addresses, wishlist, favorites, and stock alerts...');
  const savedAddresses = await Promise.all(
    users.slice(0, 8).flatMap((user, index) => [
      prisma.savedAddress.create({
        data: {
          userId: user.id,
          label: 'Home',
          fullName: user.name,
          email: user.email,
          phone: `+1-555-20${String(index).padStart(2, '0')}`,
          address: `${120 + index} Elm Street`,
          city: cityStateCountry[index % cityStateCountry.length].city,
          state: cityStateCountry[index % cityStateCountry.length].state,
          zipCode: cityStateCountry[index % cityStateCountry.length].zip,
          country: cityStateCountry[index % cityStateCountry.length].country,
          isDefault: true,
        },
      }),
      prisma.savedAddress.create({
        data: {
          userId: user.id,
          label: 'Office',
          fullName: user.name,
          email: user.email,
          phone: `+1-555-30${String(index).padStart(2, '0')}`,
          address: `${20 + index} Library Plaza`,
          city: cityStateCountry[(index + 1) % cityStateCountry.length].city,
          state: cityStateCountry[(index + 1) % cityStateCountry.length].state,
          zipCode: cityStateCountry[(index + 1) % cityStateCountry.length].zip,
          country: cityStateCountry[(index + 1) % cityStateCountry.length].country,
          isDefault: false,
        },
      }),
    ]),
  );

  await prisma.wishlistItem.createMany({
    data: users.slice(0, 12).flatMap((user, index) => [
      {
        userId: user.id,
        bookId: books[(index * 2 + 5) % books.length].id,
        createdAt: daysAgo(12 - (index % 8), 10),
      },
      {
        userId: user.id,
        bookId: books[(index * 3 + 9) % books.length].id,
        createdAt: daysAgo(8 - (index % 6), 18),
      },
    ]),
    skipDuplicates: true,
  });

  await prisma.favoriteItem.createMany({
    data: users.slice(0, 10).flatMap((user, index) => [
      {
        userId: user.id,
        bookId: books[(index * 4 + 1) % books.length].id,
        createdAt: daysAgo(10 - (index % 5), 9),
      },
      {
        userId: user.id,
        bookId: books[(index * 4 + 2) % books.length].id,
        createdAt: daysAgo(6 - (index % 4), 19),
      },
    ]),
    skipDuplicates: true,
  });

  await prisma.stockAlertSubscription.createMany({
    data: users.slice(0, 8).map((user, index) => ({
      userId: user.id,
      bookId: books[(index * 7 + 10) % books.length].id,
      isActive: true,
      notifiedAt: index % 3 === 0 ? daysAgo(index + 1, 14) : null,
      createdAt: daysAgo(7 - (index % 4), 12),
      updatedAt: daysAgo(index % 3, 12),
    })),
    skipDuplicates: true,
  });

  console.log('📖 Creating reading history, eBook access, and annotations...');
  const digitalBooks = await Promise.all([
    prisma.book.update({
      where: { id: books[3].id },
      data: {
        isDigital: true,
        ebookFormat: 'EPUB',
        ebookFilePath: 'dune.epub',
        ebookPrice: 9.99,
        totalPages: 544,
      },
    }),
    prisma.book.update({
      where: { id: books[5].id },
      data: {
        isDigital: true,
        ebookFormat: 'PDF',
        ebookFilePath: 'clean-code.pdf',
        ebookPrice: 24.99,
        totalPages: 464,
      },
    }),
    prisma.book.update({
      where: { id: books[12].id },
      data: {
        isDigital: true,
        ebookFormat: 'EPUB',
        ebookFilePath: 'pragmatic-programmer.epub',
        ebookPrice: 19.99,
        totalPages: 352,
      },
    }),
    prisma.book.update({
      where: { id: books[33].id },
      data: {
        isDigital: true,
        ebookFormat: 'EPUB',
        ebookFilePath: 'project-hail-mary.epub',
        ebookPrice: 11.99,
        totalPages: 496,
      },
    }),
  ]);

  const readingItems = await Promise.all(
    users.slice(0, 10).map((user, index) => {
      const book = books[(index * 3 + 2) % books.length];
      const statusOptions: ReadingStatus[] = [
        ReadingStatus.TO_READ,
        ReadingStatus.READING,
        ReadingStatus.FINISHED,
      ];
      const status = statusOptions[index % statusOptions.length];
      return prisma.readingItem.create({
        data: {
          userId: user.id,
          bookId: book.id,
          status,
          currentPage: status === 'TO_READ' ? 0 : 30 + (index * 15),
          totalPages: 220 + (index * 20),
          dailyGoalPages: 10 + (index % 4) * 5,
          startedAt: status === 'TO_READ' ? null : daysAgo(20 - index, 7),
          finishedAt: status === 'FINISHED' ? daysAgo(index, 20) : null,
          createdAt: daysAgo(25 - index, 8),
          updatedAt: daysAgo(index % 5, 18),
        },
      });
    }),
  );

  await prisma.readingSession.createMany({
    data: readingItems.flatMap((item, index) => [
      {
        userId: item.userId,
        bookId: item.bookId,
        readingItemId: item.id,
        pagesRead: 12 + (index % 8),
        sessionDate: daysAgo(6 - (index % 5), 7),
        notes: 'Morning reading session before work.',
        createdAt: daysAgo(6 - (index % 5), 7),
        updatedAt: daysAgo(6 - (index % 5), 7),
      },
      {
        userId: item.userId,
        bookId: item.bookId,
        readingItemId: item.id,
        pagesRead: 18 + (index % 10),
        sessionDate: daysAgo(2 - (index % 2), 21),
        notes: index % 2 === 0 ? 'Annotated a few passages.' : 'Fast session on the commute.',
        createdAt: daysAgo(2 - (index % 2), 21),
        updatedAt: daysAgo(2 - (index % 2), 21),
      },
    ]),
  });

  const userBookAccesses = await Promise.all(
    users.slice(0, 6).map((user, index) =>
      prisma.userBookAccess.create({
        data: {
          userId: user.id,
          bookId: digitalBooks[index % digitalBooks.length].id,
          sourceOrderId: createdOrders[index]?.id ?? null,
          grantedAt: daysAgo(12 - index, 13),
        },
      }),
    ),
  );

  await prisma.ebookProgress.createMany({
    data: userBookAccesses.map((access, index) => ({
      userId: access.userId,
      bookId: access.bookId,
      page: 25 + index * 18,
      locationCfi: `epubcfi(/6/${index + 2}!/4/${index + 10})`,
      percent: Number((12 + index * 11.5).toFixed(2)),
      createdAt: daysAgo(10 - index, 11),
      updatedAt: daysAgo(index % 3, 17),
    })),
  });

  await prisma.ebookBookmark.createMany({
    data: userBookAccesses.flatMap((access, index) => [
      {
        userId: access.userId,
        bookId: access.bookId,
        page: 18 + index * 7,
        locationCfi: `epubcfi(/6/${index + 3}!/4/${index + 12})`,
        label: 'Key turning point',
        createdAt: daysAgo(5 - (index % 3), 20),
        updatedAt: daysAgo(5 - (index % 3), 20),
      },
      {
        userId: access.userId,
        bookId: access.bookId,
        page: 33 + index * 5,
        locationCfi: `epubcfi(/6/${index + 4}!/4/${index + 14})`,
        label: 'Return here for quote',
        createdAt: daysAgo(2 - (index % 2), 8),
        updatedAt: daysAgo(2 - (index % 2), 8),
      },
    ]),
  });

  await prisma.ebookNote.createMany({
    data: userBookAccesses.map((access, index) => ({
      userId: access.userId,
      bookId: access.bookId,
      page: 21 + index * 6,
      locationCfi: `epubcfi(/6/${index + 5}!/4/${index + 16})`,
      content: `Seed note ${index + 1}: capturing a useful takeaway for reading-state UI tests.`,
      createdAt: daysAgo(4 - (index % 3), 9),
      updatedAt: daysAgo(1, 19),
    })),
  });

  await prisma.ebookHighlight.createMany({
    data: userBookAccesses.map((access, index) => ({
      userId: access.userId,
      bookId: access.bookId,
      page: 17 + index * 9,
      startCfi: `epubcfi(/6/${index + 6}!/4/${index + 18})`,
      endCfi: `epubcfi(/6/${index + 6}!/4/${index + 19})`,
      textSnippet: `Highlighted passage ${index + 1} for annotation and export testing.`,
      color: ['yellow', 'blue', 'pink', 'green'][index % 4],
      createdAt: daysAgo(3 - (index % 2), 15),
      updatedAt: daysAgo(index % 2, 16),
    })),
  });

  console.log('📝 Creating blog posts, poems, follows, reactions, and blog notifications...');
  const blogAuthors = users.slice(0, 6);
  const followPairs = [
    [users[6], blogAuthors[0]],
    [users[7], blogAuthors[0]],
    [users[8], blogAuthors[1]],
    [users[9], blogAuthors[1]],
    [users[10], blogAuthors[2]],
    [users[11], blogAuthors[3]],
    [users[12], blogAuthors[4]],
    [users[13], blogAuthors[5]],
    [users[14], blogAuthors[2]],
  ];

  await prisma.authorFollow.createMany({
    data: followPairs.map(([follower, author], index) => ({
      followerId: follower.id,
      authorId: author.id,
      createdAt: daysAgo(15 - index, 10),
    })),
    skipDuplicates: true,
  });

  const blogSeeds = [
    {
      authorId: blogAuthors[0].id,
      title: 'Shelving a City by Memory',
      subtitle: 'How a bookstore map becomes a personal atlas',
      content:
        '<p>I still judge a neighborhood by the first independent bookstore I find there.</p><p>Some shelves feel like weather reports. Others feel like invitations.</p>',
      status: 'PUBLISHED' as const,
      tags: ['essay', 'bookstores', 'city-life'],
      bookRefs: [books[0].id, books[11].id],
      readingTime: 4,
      coverImage: books[0].coverImage,
      createdAt: daysAgo(11, 9),
      viewsCount: 18,
      likesCount: 4,
      commentsCount: 2,
    },
    {
      authorId: blogAuthors[1].id,
      title: 'Inventory Poem for a Closing Shift',
      subtitle: 'A short poem for boxes, dust, and fluorescent light',
      content:
        '<p>Count the spines, then count the silence.</p><p>Every carton opens like a weather front.</p><p>The register sleeps. The poems do not.</p>',
      status: 'PUBLISHED' as const,
      tags: ['poem', 'closing-shift', 'poetry'],
      bookRefs: [books[39].id],
      readingTime: 2,
      coverImage: books[39].coverImage,
      createdAt: daysAgo(9, 20),
      viewsCount: 27,
      likesCount: 6,
      commentsCount: 3,
    },
    {
      authorId: blogAuthors[2].id,
      title: 'Three Ways Readers Signal Demand Before They Buy',
      subtitle: 'Wishlist patterns, holds, and quiet intent',
      content:
        '<p>The cart is loud, but the wishlist is honest.</p><p>Readers often tell you what to stock weeks before they check out.</p>',
      status: 'PUBLISHED' as const,
      tags: ['ops', 'recommendations', 'retail'],
      bookRefs: [books[24].id, books[32].id],
      readingTime: 5,
      coverImage: books[24].coverImage,
      createdAt: daysAgo(7, 14),
      viewsCount: 21,
      likesCount: 5,
      commentsCount: 1,
    },
    {
      authorId: blogAuthors[3].id,
      title: 'Draft Notes on Summer Reading Tables',
      subtitle: 'Workshopping a front-of-store feature',
      content:
        '<p>This draft collects themes, pairings, and display copy for a summer campaign.</p>',
      status: 'DRAFT' as const,
      tags: ['draft', 'campaign'],
      bookRefs: [books[16].id],
      readingTime: 3,
      coverImage: books[16].coverImage,
      createdAt: daysAgo(3, 13),
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    },
    {
      authorId: blogAuthors[4].id,
      title: 'Poem for a Book Arriving Damaged but Still Loved',
      subtitle: 'A short repair prayer',
      content:
        '<p>Bent corner, bruised jacket, still the sentence lifts.</p><p>Some books survive transit exactly the way readers do.</p>',
      status: 'PENDING_REVIEW' as const,
      tags: ['poem', 'repair', 'dispatch'],
      bookRefs: [books[8].id],
      readingTime: 1,
      coverImage: books[8].coverImage,
      createdAt: daysAgo(2, 18),
      scheduledAt: daysAgo(-2, 9),
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    },
    {
      authorId: blogAuthors[5].id,
      title: 'Rejected Ad Copy Disguised as Criticism',
      subtitle: 'Moderation case for testing workflow',
      content:
        '<p>This piece intentionally overreaches into promotion so moderation can reject it in seeded data.</p>',
      status: 'REJECTED' as const,
      moderationReason: 'Too promotional and not aligned with editorial guidelines.',
      reviewedByUserId: adminUser.id,
      reviewedAt: daysAgo(1, 12),
      tags: ['moderation', 'editorial'],
      bookRefs: [books[22].id],
      readingTime: 2,
      coverImage: books[22].coverImage,
      createdAt: daysAgo(2, 10),
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    },
  ];

  const uniqueBlogTagNames = Array.from(new Set(blogSeeds.flatMap((seed) => seed.tags)));
  await prisma.blogTag.createMany({
    data: uniqueBlogTagNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
  const blogTags = await prisma.blogTag.findMany({
    where: { name: { in: uniqueBlogTagNames } },
    select: { id: true, name: true },
  });
  const blogTagIdByName = new Map(blogTags.map((tag) => [tag.name, tag.id]));

  const createdBlogs = await Promise.all(
    blogSeeds.map((seed) =>
      prisma.authorBlog.create({
        data: {
          authorId: seed.authorId,
          title: seed.title,
          subtitle: seed.subtitle,
          content: seed.content,
          coverImage: seed.coverImage,
          readingTime: seed.readingTime,
          status: seed.status,
          moderationReason: seed.moderationReason ?? null,
          reviewedByUserId: seed.reviewedByUserId ?? null,
          reviewedAt: seed.reviewedAt ?? null,
          scheduledAt: seed.status === 'PUBLISHED' ? null : (seed.scheduledAt ?? null),
          viewsCount: seed.viewsCount,
          likesCount: seed.likesCount,
          commentsCount: seed.commentsCount,
          createdAt: seed.createdAt,
          updatedAt: daysAgo(0, 12),
          tags: {
            create: seed.tags.map((name) => ({
              tag: {
                connect: { id: blogTagIdByName.get(name)! },
              },
            })),
          },
          bookReferences: {
            create: seed.bookRefs.map((bookId) => ({
              book: { connect: { id: bookId } },
            })),
          },
        },
      }),
    ),
  );

  const publishedBlogs = createdBlogs.filter((blog) => blog.status === 'PUBLISHED');
  const blogInteractionUsers = users.slice(6, 16);

  await prisma.blogPostView.createMany({
    data: publishedBlogs.flatMap((blog, index) =>
      blogInteractionUsers.slice(index, index + 3).map((user, offset) => ({
        postId: blog.id,
        userId: user.id,
        createdAt: daysAgo(5 - offset, 10 + offset),
      })),
    ),
    skipDuplicates: true,
  });

  await prisma.blogPostAnonymousView.createMany({
    data: publishedBlogs.flatMap((blog, index) =>
      Array.from({ length: 3 }, (_, offset) => ({
        postId: blog.id,
        visitorId: `anon-${index + 1}-${offset + 1}`,
        createdAt: daysAgo(4 - offset, 9 + offset),
      })),
    ),
    skipDuplicates: true,
  });

  await prisma.blogLike.createMany({
    data: [
      { postId: publishedBlogs[0].id, userId: users[6].id },
      { postId: publishedBlogs[0].id, userId: users[7].id },
      { postId: publishedBlogs[0].id, userId: users[8].id },
      { postId: publishedBlogs[0].id, userId: users[9].id },
      { postId: publishedBlogs[1].id, userId: users[6].id },
      { postId: publishedBlogs[1].id, userId: users[10].id },
      { postId: publishedBlogs[1].id, userId: users[11].id },
      { postId: publishedBlogs[1].id, userId: users[12].id },
      { postId: publishedBlogs[1].id, userId: users[13].id },
      { postId: publishedBlogs[1].id, userId: users[14].id },
      { postId: publishedBlogs[2].id, userId: users[7].id },
      { postId: publishedBlogs[2].id, userId: users[15].id },
      { postId: publishedBlogs[2].id, userId: users[16].id },
      { postId: publishedBlogs[2].id, userId: users[17].id },
      { postId: publishedBlogs[2].id, userId: users[18].id },
    ],
    skipDuplicates: true,
  });

  await prisma.blogComment.createMany({
    data: [
      {
        blogId: publishedBlogs[0].id,
        userId: users[6].id,
        content: 'The line about shelves feeling like weather reports is excellent.',
        createdAt: daysAgo(5, 18),
      },
      {
        blogId: publishedBlogs[0].id,
        userId: users[7].id,
        content: 'This makes me want a city-by-city bookstore map feature.',
        createdAt: daysAgo(4, 11),
      },
      {
        blogId: publishedBlogs[1].id,
        userId: users[8].id,
        content: 'Short, strange, and exactly right for the page.',
        createdAt: daysAgo(3, 20),
      },
      {
        blogId: publishedBlogs[1].id,
        userId: users[9].id,
        content: 'Using this one to test poem cards in the frontend.',
        createdAt: daysAgo(2, 10),
      },
      {
        blogId: publishedBlogs[1].id,
        userId: users[10].id,
        content: 'Good moderation seed too because it is clearly a poem, not a review.',
        createdAt: daysAgo(1, 13),
      },
      {
        blogId: publishedBlogs[2].id,
        userId: users[11].id,
        content: 'This should pair well with reorder suggestions and lead demand reporting.',
        createdAt: daysAgo(1, 18),
      },
    ],
  });

  await prisma.blogNotification.createMany({
    data: [
      {
        userId: publishedBlogs[0].authorId,
        blogId: publishedBlogs[0].id,
        authorId: publishedBlogs[0].authorId,
        message: `${users[6].name} commented on "${publishedBlogs[0].title}".`,
        createdAt: daysAgo(4, 11),
      },
      {
        userId: publishedBlogs[1].authorId,
        blogId: publishedBlogs[1].id,
        authorId: publishedBlogs[1].authorId,
        message: `${users[9].name} started following your writing.`,
        createdAt: daysAgo(2, 15),
      },
      {
        userId: publishedBlogs[2].authorId,
        blogId: publishedBlogs[2].id,
        authorId: publishedBlogs[2].authorId,
        message: `${users[11].name} bookmarked your operations post for later.`,
        createdAt: daysAgo(1, 19),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: publishedBlogs[0].authorId,
        type: 'blog_comment',
        title: 'New comment on your post',
        message: `${users[7].name} commented on "${publishedBlogs[0].title}".`,
        link: `/blogs/${publishedBlogs[0].id}`,
        isRead: false,
      },
      {
        userId: publishedBlogs[1].authorId,
        type: 'blog_like',
        title: 'Your poem got new likes',
        message: `${users[10].name} and others liked "${publishedBlogs[1].title}".`,
        link: `/blogs/${publishedBlogs[1].id}`,
        isRead: false,
      },
      {
        userId: publishedBlogs[2].authorId,
        type: 'blog_follow',
        title: 'You have a new follower',
        message: `${users[14].name} started following your writing.`,
        link: `/writers/${publishedBlogs[2].authorId}`,
        isRead: true,
      },
    ],
  });

  console.log('🎁 Creating loyalty rewards, sticker history, and redemptions...');
  const loyaltyRewards = await Promise.all([
    prisma.loyaltyReward.create({
      data: {
        name: '5% Reader Coupon',
        description: 'A lightweight discount for repeat customers.',
        stickerCost: 30,
        rewardType: 'PERCENT_COUPON',
        discountValue: 5,
        maxDiscountAmount: 15,
        isActive: true,
      },
    }),
    prisma.loyaltyReward.create({
      data: {
        name: '$8 Weekend Coupon',
        description: 'Fixed-value reward for medium sticker balances.',
        stickerCost: 55,
        rewardType: 'FIXED_COUPON',
        discountValue: 8,
        isActive: true,
      },
    }),
    prisma.loyaltyReward.create({
      data: {
        name: 'Free eBook: Project Hail Mary',
        description: 'Redeem for a seeded digital title.',
        stickerCost: 80,
        rewardType: 'FREE_EBOOK',
        rewardBookId: digitalBooks[3].id,
        isActive: true,
      },
    }),
  ]);

  const stickerRecipients = users.slice(0, 6);
  for (let index = 0; index < stickerRecipients.length; index += 1) {
    const user = stickerRecipients[index];
    const orderEarned = 16 + index * 4;
    const adminGrant = index % 2 === 0 ? 10 : 0;
    const balance = orderEarned + adminGrant - (index === 0 ? 30 : index === 2 ? 80 : 0);
    await prisma.user.update({
      where: { id: user.id },
      data: { stickerBalance: balance },
    });

    await prisma.stickerLedger.create({
      data: {
        userId: user.id,
        actorUserId: adminUser.id,
        orderId: createdOrders[index]?.id ?? null,
        type: 'ORDER_EARN',
        delta: orderEarned,
        note: 'Stickers earned from seeded completed orders.',
        createdAt: daysAgo(8 - index, 13),
      },
    });

    if (adminGrant > 0) {
      await prisma.stickerLedger.create({
        data: {
          userId: user.id,
          actorUserId: adminUser.id,
          type: 'ADMIN_GRANT',
          delta: adminGrant,
          note: 'Manual goodwill grant for testing admin tools.',
          createdAt: daysAgo(3 - (index % 2), 16),
        },
      });
    }
  }

  const generatedPromo = await prisma.promotionCode.create({
    data: {
      code: 'LOYALTY-5OFF-SEED',
      assignedUserId: stickerRecipients[0].id,
      name: 'Seeded loyalty coupon',
      description: 'Generated from redemption seed flow.',
      discountType: 'PERCENT',
      discountValue: 5,
      minSubtotal: 20,
      maxDiscountAmount: 15,
      isActive: true,
    },
  });

  const loyaltyRedemptions = await Promise.all([
    prisma.loyaltyRedemption.create({
      data: {
        userId: stickerRecipients[0].id,
        rewardId: loyaltyRewards[0].id,
        stickerCost: loyaltyRewards[0].stickerCost,
        generatedPromoId: generatedPromo.id,
        createdAt: daysAgo(1, 14),
      },
    }),
    prisma.loyaltyRedemption.create({
      data: {
        userId: stickerRecipients[2].id,
        rewardId: loyaltyRewards[2].id,
        stickerCost: loyaltyRewards[2].stickerCost,
        grantedBookId: digitalBooks[3].id,
        createdAt: daysAgo(0, 10),
      },
    }),
  ]);

  await prisma.stickerLedger.createMany({
    data: [
      {
        userId: stickerRecipients[0].id,
        actorUserId: adminUser.id,
        redemptionId: loyaltyRedemptions[0].id,
        type: 'REWARD_REDEEM',
        delta: -loyaltyRewards[0].stickerCost,
        note: 'Redeemed for percentage coupon.',
        createdAt: daysAgo(1, 14),
      },
      {
        userId: stickerRecipients[2].id,
        actorUserId: adminUser.id,
        redemptionId: loyaltyRedemptions[1].id,
        type: 'REWARD_REDEEM',
        delta: -loyaltyRewards[2].stickerCost,
        note: 'Redeemed for free eBook reward.',
        createdAt: daysAgo(0, 10),
      },
    ],
  });

  console.log('↩️ Creating return requests...');
  const completedOrderIds = createdOrders
    .filter((order) => order.status === 'COMPLETED')
    .map((order) => order.id);
  const completedOrderItems = await prisma.orderItem.findMany({
    where: { orderId: { in: completedOrderIds } },
    orderBy: { createdAt: 'asc' },
  });

  const returnRequests = await Promise.all(
    completedOrderItems.slice(0, 4).map((item, index) =>
      prisma.returnRequest.create({
        data: {
          orderId: item.orderId,
          userId: createdOrders.find((order) => order.id === item.orderId)!.userId,
          bookId: item.bookId,
          status: ['REQUESTED', 'APPROVED', 'REFUNDED', 'CLOSED'][index] as
            | 'REQUESTED'
            | 'APPROVED'
            | 'REFUNDED'
            | 'CLOSED',
          reason: [
            'Received the wrong edition',
            'Cover damaged during shipping',
            'Duplicate gift purchase',
            'Pages were misprinted',
          ][index],
          details: 'Seeded return for order management and admin review testing.',
          requestedQty: 1,
          resolutionNote:
            index === 0 ? null : 'Reviewed and updated by the finance/support workflow.',
          refundAmount: Number(item.price),
          reviewedByUserId: index === 0 ? null : staffSeedUsers[2].id,
          reviewedAt: index === 0 ? null : daysAgo(1 - (index % 2), 16),
          createdAt: daysAgo(2 + index, 12),
          updatedAt: daysAgo(index % 2, 18),
        },
      }),
    ),
  );

  console.log('📥 Creating book leads and partner consignment deals...');
  const bookLeads = await Promise.all([
    prisma.bookLead.create({
      data: {
        title: 'Tomorrow, and Tomorrow, and Tomorrow',
        author: 'Gabrielle Zevin',
        note: 'High demand from wishlist and walk-in requests.',
        source: 'USER_REQUEST',
        status: 'NEW',
        priority: 4,
        requestedByUserId: users[4].id,
      },
    }),
    prisma.bookLead.create({
      data: {
        title: 'Small Things Like These',
        author: 'Claire Keegan',
        note: 'Suggested for a winter front-table display.',
        source: 'STAFF_IDEA',
        status: 'SOURCING',
        priority: 3,
        requestedByUserId: staffSeedUsers[1].id,
        assignedToUserId: staffSeedUsers[1].id,
        procurementIsbn: '978-0-8021-5903-8',
        procurementPrice: 10.5,
        procurementCategories: ['Fiction', 'Literary'],
        procurementGenres: ['Novella', 'Contemporary'],
        procurementDescription: 'Quiet literary fiction with strong seasonal demand potential.',
        procurementCoverImage: 'https://covers.openlibrary.org/b/isbn/9780802159038-L.jpg?default=false',
        procurementStock: 16,
        procurementWarehouseId: warehouses[0].id,
        procurementQuantity: 12,
        procurementEstimatedCost: 126,
        procurementReviewNote: 'Awaiting final vendor quote.',
      },
    }),
    prisma.bookLead.create({
      data: {
        title: 'Orbital',
        author: 'Samantha Harvey',
        note: 'Partner pitch for literary/science crossover readers.',
        source: 'PARTNER_PITCH',
        status: 'APPROVED_TO_BUY',
        priority: 5,
        requestedByUserId: users[8].id,
        assignedToUserId: staffSeedUsers[1].id,
        procurementIsbn: '978-0-8021-6402-5',
        procurementPrice: 13.25,
        procurementCategories: ['Fiction', 'Science'],
        procurementGenres: ['Literary', 'Space'],
        procurementDescription: 'Strong fit for prize-fiction and science-curious readers.',
        procurementCoverImage: 'https://covers.openlibrary.org/b/isbn/9780802164025-L.jpg?default=false',
        procurementStock: 20,
        procurementWarehouseId: warehouses[1].id,
        procurementQuantity: 18,
        procurementEstimatedCost: 238.5,
        procurementReviewNote: 'Approved to enter partner pipeline.',
      },
    }),
    prisma.bookLead.create({
      data: {
        title: 'Martyr!',
        author: 'Kaveh Akbar',
        note: 'Converted demand lead for literary fiction readers.',
        source: 'USER_REQUEST',
        status: 'CONVERTED_TO_BOOK',
        priority: 4,
        requestedByUserId: users[9].id,
        assignedToUserId: staffSeedUsers[1].id,
        convertedBookId: books[47].id,
        procurementIsbn: '978-0-593-53472-4',
        procurementPrice: 12.75,
        procurementCategories: ['Fiction', 'Literary'],
        procurementGenres: ['Contemporary'],
        procurementDescription: 'Converted into catalog for testing lead conversion history.',
        procurementCoverImage: books[47].coverImage,
        procurementStock: 14,
        procurementWarehouseId: warehouses[2].id,
        procurementQuantity: 10,
        procurementEstimatedCost: 127.5,
        procurementReviewNote: 'Converted to active catalog book.',
      },
    }),
    prisma.bookLead.create({
      data: {
        title: 'Experimental Shelf Zine Vol. 1',
        author: 'Various Authors',
        note: 'Rejected due to unclear distribution and rights.',
        source: 'PARTNER_PITCH',
        status: 'REJECTED',
        priority: 2,
        requestedByUserId: users[10].id,
        assignedToUserId: staffSeedUsers[1].id,
        procurementReviewNote: 'Insufficient metadata and no stable supply channel.',
      },
    }),
  ]);

  const partnerDeals = await Promise.all([
    prisma.partnerConsignmentDeal.create({
      data: {
        partnerName: 'Mara Ellison',
        partnerCompany: 'North Dock Press',
        partnerEmail: 'rights@northdockpress.example',
        leadId: bookLeads[2].id,
        bookId: null,
        status: 'ACTIVE',
        revenueSharePct: 22.5,
        effectiveFrom: daysAgo(30, 9),
        effectiveTo: null,
        termsNote: 'Quarterly settlement with co-marketing support.',
        createdByUserId: adminUser.id,
      },
    }),
    prisma.partnerConsignmentDeal.create({
      data: {
        partnerName: 'Iris Vale',
        partnerCompany: 'Lantern Poems Studio',
        partnerEmail: 'partnerships@lanternpoems.example',
        bookId: books[39].id,
        status: 'DRAFT',
        revenueSharePct: 18,
        effectiveFrom: daysAgo(12, 10),
        effectiveTo: null,
        termsNote: 'Draft deal linked to poetry merchandising tests.',
        createdByUserId: adminUser.id,
      },
    }),
  ]);

  const partnerSettlements = await Promise.all([
    prisma.partnerSettlement.create({
      data: {
        dealId: partnerDeals[0].id,
        periodStart: new Date('2026-02-01T00:00:00.000Z'),
        periodEnd: new Date('2026-02-28T23:59:59.000Z'),
        grossSalesAmount: 1240,
        partnerShareAmount: 279,
        status: 'PAID',
        paidAt: daysAgo(6, 15),
        note: 'First seeded paid settlement.',
      },
    }),
    prisma.partnerSettlement.create({
      data: {
        dealId: partnerDeals[0].id,
        periodStart: new Date('2026-03-01T00:00:00.000Z'),
        periodEnd: new Date('2026-03-31T23:59:59.000Z'),
        grossSalesAmount: 860,
        partnerShareAmount: 193.5,
        status: 'PENDING',
        note: 'Current cycle pending finance confirmation.',
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:`);
  console.log(`   - 1 super admin user (superadmin@bookstore.com / superadmin123)`);
  console.log(`   - 1 admin user (admin@bookstore.com / admin123)`);
  console.log(`   - 23 regular users (password: user123)`);
  console.log(`   - 71 books (various genres and stock levels)`);
  console.log(`   - 4 cart items`);
  console.log(`   - ${createdOrders.length} orders with ${createdOrderItemsCount} order items`);
  console.log(`   - ${warehouses.length} warehouses`);
  console.log(`   - ${warehouseStockRows.length} warehouse stock rows`);
  console.log(`   - ${createdTransfers.length} warehouse transfers`);
  console.log(`   - ${alertInputs.length} warehouse alerts`);
  console.log(`   - ${taskInputs.length} staff tasks`);
  console.log(`   - ${auditInputs.length} staff audit logs`);
  console.log(`   - ${createdInquiries.length} inquiries`);
  console.log(`   - ${totalReviewsCreated} reviews`);
  console.log(`   - ${notificationSeedData.length} user notifications`);
  console.log(`   - ${stores.length} stores with ${storeStockRows.length} store stock rows`);
  console.log(`   - ${storeTransfers.length} store transfers`);
  console.log(`   - ${savedAddresses.length} saved addresses`);
  console.log(`   - ${readingItems.length} reading items and ${userBookAccesses.length} ebook access grants`);
  console.log(`   - ${createdBlogs.length} blog posts/poems`);
  console.log(`   - ${loyaltyRewards.length} loyalty rewards and ${loyaltyRedemptions.length} redemptions`);
  console.log(`   - ${returnRequests.length} return requests`);
  console.log(`   - ${bookLeads.length} book leads`);
  console.log(`   - ${partnerDeals.length} partner deals and ${partnerSettlements.length} settlements`);
  console.log(`   - ${repeatedAuthors.length} authors with multiple books`);
  console.log(`\n📚 Book Categories:`);
  console.log(`   - Fiction & Classics`);
  console.log(`   - Science Fiction & Fantasy`);
  console.log(`   - Programming & Technology`);
  console.log(`   - Mystery & Thriller`);
  console.log(`   - Self-Help & Business`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Super Admin: superadmin@bookstore.com / superadmin123`);
  console.log(`   Admin: admin@bookstore.com / admin123`);
  console.log(`   Users: john.doe@example.com / user123`);
  console.log(`          jane.smith@example.com / user123`);
  console.log(`          bob.wilson@example.com / user123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
