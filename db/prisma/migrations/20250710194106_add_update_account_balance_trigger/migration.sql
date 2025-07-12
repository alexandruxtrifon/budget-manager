CREATE OR REPLACE FUNCTION update_account_balance() RETURNS TRIGGER AS $$
DECLARE
    target_account_id INT;
BEGIN
    -- Identify which account was affected
    IF (TG_OP = 'INSERT') THEN
        target_account_id := NEW.account_id;
    ELSIF (TG_OP = 'DELETE') THEN
        target_account_id := OLD.account_id;
    END IF;

    UPDATE accounts
    SET current_balance = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN transaction_type = 'expense' THEN -amount
                WHEN transaction_type = 'income' THEN amount
                ELSE 0 -- handle 'transfer' or unexpected types if needed
            END
        ), 0)
        FROM transactions
        WHERE account_id = target_account_id
    )
    WHERE account_id = target_account_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER trg_update_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();