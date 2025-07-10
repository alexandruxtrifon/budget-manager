-- This is an empty migration.

CREATE INDEX idx_transactions_user_date ON "Transaction"(user_id, transaction_date);
CREATE INDEX idx_transactions_desc ON "Transaction" USING GIN (to_tsvector('simple', description));
CREATE INDEX idx_classification_rules_user ON "ClassificationRule"(user_id);
CREATE INDEX idx_budgets_user_period ON "Budget"(user_id, period_start, period_end);

-- Trigger for updating account balance
CREATE OR REPLACE FUNCTION update_account_balance() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE "Account" SET current_balance = current_balance + NEW.amount * CASE WHEN NEW.transaction_type = 'expense' THEN -1 ELSE 1 END
        WHERE account_id = NEW.account_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_balance
AFTER INSERT ON "Transaction"
FOR EACH ROW EXECUTE FUNCTION update_account_balance();