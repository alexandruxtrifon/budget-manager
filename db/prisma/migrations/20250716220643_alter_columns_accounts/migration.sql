ALTER TABLE accounts 
    ALTER COLUMN initial_balance DROP NOT NULL,
    ALTER COLUMN current_balance DROP NOT NULL;