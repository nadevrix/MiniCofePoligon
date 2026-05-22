-- Tabla de órdenes de pago
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  description TEXT NOT NULL,
  amount DECIMAL(18, 6) NOT NULL,
  token VARCHAR(10) NOT NULL CHECK (token IN ('USDC', 'USDT')),
  wallet_index INT NOT NULL,
  payment_address VARCHAR(42) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'underpaid', 'overpaid', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_limit_minutes INT NOT NULL DEFAULT 15,
  amount_received DECIMAL(18, 6),
  paid_at TIMESTAMPTZ,
  payer_wallet VARCHAR(42),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por address (lo usa el webhook)
CREATE INDEX idx_orders_payment_address ON orders(payment_address);
CREATE INDEX idx_orders_status ON orders(status);

