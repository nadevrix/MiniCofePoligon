-- Proyectos del merchant
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  merchant_wallet VARCHAR(42) NOT NULL,
  webhook_url TEXT,
  network VARCHAR(20) NOT NULL DEFAULT 'mainnet',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Órdenes de pago vinculadas a un proyecto
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  project_id UUID REFERENCES projects(id),
  description TEXT NOT NULL,
  amount DECIMAL(18, 6) NOT NULL,
  token VARCHAR(10) NOT NULL CHECK (token IN ('USDC', 'USDT')),
  payment_address VARCHAR(42) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'underpaid', 'overpaid', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_limit_minutes INT NOT NULL DEFAULT 15,
  amount_received DECIMAL(18, 6),
  paid_at TIMESTAMPTZ,
  payer_wallet VARCHAR(42),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_payment_address ON orders(payment_address);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_project_id ON orders(project_id);
