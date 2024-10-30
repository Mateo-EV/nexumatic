import { type InferSelectModel, relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
    precision: 0,
  }).defaultNow(),
  image: varchar("image", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  subscriptions: many(subscriptions),
  workflows: many(workflows),
  connections: many(connections),
  sessions: many(sessions),
}));

export type User = InferSelectModel<typeof users>;

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).unique().notNull(),
  features: jsonb("features").notNull(),
});

export const plansRelations = relations(plans, ({ many }) => ({
  subcriptions: many(subscriptions),
}));

export type Plan = InferSelectModel<typeof plans>;

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expire"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict", onUpdate: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", {
    length: 255,
  })
    .notNull()
    .unique(),
  status: varchar("status", { length: 50 })
    .$type<SubscriptionStatus>()
    .notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export type Subscription = InferSelectModel<typeof subscriptions>;

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(users, {
    fields: [workflows.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
  workflowRuns: many(workflowRuns),
  tasksDependencies: many(taskDependencies),
}));

export type WorkFlow = InferSelectModel<typeof workflows>;

export type ServicesMethods<T = unknown> = {
  Discord: { postMessage: T };
  ["Google Drive"]: { listenFilesAdded: T };
  OneDrive: { listenFilesAdded: T };
  Notion: { addBlock: T };
  Slack: { postMessage: T };
  Twitter: { postTweet: T };
  Youtube: { postContent: T };
  Facebook: { postContent: T };
  Instagram: { postContent: T };
  Gmail: { sendEmail: T };
  Email: { sendEmail: T };
  Outlook: { sendEmail: T };
  ["Manual Trigger"]: { clickButton: T };
};

export type ServicesTypes = "trigger" | "action";

export type ServiceMethods = {
  [K in keyof ServicesMethods]: keyof ServicesMethods[K];
}[keyof ServicesMethods];

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 })
      .notNull()
      .$type<keyof ServicesMethods>(),
    type: varchar("type", { length: 50 }).notNull().$type<ServicesTypes>(),
    method: varchar("method", { length: 50 }).notNull().$type<ServiceMethods>(),
  },
  (table) => ({
    unq: unique().on(table.name, table.method),
  }),
);

export type Service = InferSelectModel<typeof services>;

export type ServiceClient = Omit<Service, "createdAt" | "updatedAt">;

export const servicesRelations = relations(services, ({ many }) => ({
  connections: many(connections),
  tasks: many(tasks),
  taskDependencies: many(taskDependencies),
}));

export const connections = pgTable(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at"),
    // configuration: jsonb("configuration").$type<ConnectionConfigurations>(),
    createdAt: timestamp("created_at", {
      precision: 0,
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      precision: 0,
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.serviceId),
  }),
);

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
  services: one(services, {
    fields: [connections.serviceId],
    references: [services.id],
  }),
}));

export type Connection = InferSelectModel<typeof connections>;

type DiscordMessageData = {
  content: string; // El mensaje en sí
  tts?: boolean; // Si es un mensaje de texto a voz (opcional)
  embeds?: Array<
    | {
        image: { url: string };
        // color?: number;
        // fields?: Array<{
        //   name: string;
        //   value: string;
        //   inline?: boolean;
        // }>;
      }
    | { url: string; title: string; description: string }
  >;
  channelId: string;
  guildId: string;
  fileIds?: number[];
};

export type TaskSpecificConfigurations = {
  Discord: { postMessage: DiscordMessageData };
  ["Google Drive"]: { listenFilesAdded: null };
  ["Manual Trigger"]: {
    clickButton: {
      content?: string;
    };
  };
};

export type TaskConfiguration =
  | TaskSpecificConfigurations["Discord"]["postMessage"]
  | TaskSpecificConfigurations["Manual Trigger"]["clickButton"];

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  positionX: numeric("axis_position", {
    precision: 10,
    scale: 2,
  }).$type<number>(),
  positionY: numeric("ord_position", {
    precision: 10,
    scale: 2,
  }).$type<number>(),
  configuration: jsonb("configuration").$type<TaskConfiguration>(),
  updatedAt: timestamp("updated_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tasksRelations = relations(tasks, ({ many, one }) => ({
  dependencies: many(taskDependencies, { relationName: "dependencies" }),
  dependents: many(taskDependencies, { relationName: "dependents" }),
  workflow: one(workflows, {
    fields: [tasks.workflowId],
    references: [workflows.id],
  }),
  service: one(services, {
    fields: [tasks.serviceId],
    references: [services.id],
  }),
  taskLogs: many(taskLogs),
  files: many(taskFiles),
}));

export type Task = InferSelectModel<typeof tasks>;

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id")
      .notNull()
      .references(() => tasks.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.dependsOnTaskId] }),
  }),
);

export const tasksDependenciesRelations = relations(
  taskDependencies,
  ({ one }) => ({
    dependency: one(tasks, {
      fields: [taskDependencies.dependsOnTaskId],
      references: [tasks.id],
      relationName: "dependents",
    }),
    dependent: one(tasks, {
      fields: [taskDependencies.dependsOnTaskId],
      references: [tasks.id],
      relationName: "dependencies",
    }),
    workflowId: one(workflows, {
      fields: [taskDependencies.workflowId],
      references: [workflows.id],
    }),
  }),
);

export type TaskDependency = InferSelectModel<typeof taskDependencies>;

export type WorkFlowRunStatus = "in_progress" | "completed" | "incompleted";

export const workflowRuns = pgTable("workflows_runs", {
  id: serial("id").primaryKey(),
  workflowId: uuid("workflow_id").references(() => workflows.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  status: varchar("status", { length: 50 })
    .$type<WorkFlowRunStatus>()
    .notNull(),
  started_at: timestamp("started_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  completed_at: timestamp("completed_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  }),
});

export const workflowRunsRelations = relations(
  workflowRuns,
  ({ one, many }) => ({
    workflowId: one(workflows, {
      fields: [workflowRuns.workflowId],
      references: [workflows.id],
    }),
    taskLogs: many(taskLogs),
  }),
);

export type WorkflowRun = InferSelectModel<typeof workflowRuns>;

export type TaskLogStatus = "in_progress" | "success" | "error";

export const taskLogs = pgTable("task_logs", {
  id: serial("id").primaryKey(),
  workflowRunId: integer("workflow_run_id").references(() => workflowRuns.id, {
    onDelete: "restrict",
    onUpdate: "cascade",
  }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade", onUpdate: "cascade" }),
  status: varchar("status", { length: 50 }).$type<TaskLogStatus>().notNull(),
  logMessage: text("log_message").notNull(),
  created_at: timestamp("created_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const taskLogsRelations = relations(taskLogs, ({ one }) => ({
  workflowRunId: one(workflowRuns, {
    fields: [taskLogs.workflowRunId],
    references: [workflowRuns.id],
  }),
  task: one(tasks, {
    fields: [taskLogs.taskId],
    references: [tasks.id],
  }),
}));

export type TaskLog = InferSelectModel<typeof taskLogs>;

export const taskFiles = pgTable("task_files", {
  id: serial("id").primaryKey(),
  taskId: uuid("task_id").references(() => tasks.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 100 }).notNull(),
  uploadedAt: timestamp("uploaded_at", {
    precision: 0,
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
});

export const taskFilesRelations = relations(taskFiles, ({ one }) => ({
  task: one(tasks, { fields: [taskFiles.taskId], references: [tasks.id] }),
}));

export type TaskFile = InferSelectModel<typeof taskFiles>;
