-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "language_preference" VARCHAR(10) NOT NULL DEFAULT 'en',
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Account" (
    "account_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "account_type" VARCHAR(20) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'RON',
    "initial_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Category" (
    "category_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "parent_category_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "ClassificationRule" (
    "rule_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "keyword" VARCHAR(255) NOT NULL,
    "category_id" INTEGER NOT NULL,
    "match_type" VARCHAR(20) NOT NULL DEFAULT 'contains',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "transaction_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "transaction_type" VARCHAR(20) NOT NULL,
    "category_id" INTEGER,
    "description" TEXT,
    "transaction_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "budget_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("budget_id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "objective_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "target_amount" DECIMAL(14,2) NOT NULL,
    "current_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "due_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("objective_id")
);

-- CreateTable
CREATE TABLE "RecurringItem" (
    "recurring_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "frequency" VARCHAR(20) NOT NULL,
    "next_date" DATE NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category_id" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringItem_pkey" PRIMARY KEY ("recurring_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "payload" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "ReportSetting" (
    "report_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "frequency" VARCHAR(20) NOT NULL,
    "last_sent" TIMESTAMPTZ,
    "format" VARCHAR(10) NOT NULL DEFAULT 'csv',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSetting_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_user_id_category_id_period_start_period_end_key" ON "Budget"("user_id", "category_id", "period_start", "period_end");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "Category"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationRule" ADD CONSTRAINT "ClassificationRule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationRule" ADD CONSTRAINT "ClassificationRule_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringItem" ADD CONSTRAINT "RecurringItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringItem" ADD CONSTRAINT "RecurringItem_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringItem" ADD CONSTRAINT "RecurringItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSetting" ADD CONSTRAINT "ReportSetting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
