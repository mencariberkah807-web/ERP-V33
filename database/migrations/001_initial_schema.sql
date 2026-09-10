BEGIN;

CREATE TABLE IF NOT EXISTS customers (
  customer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_code TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  product_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_code TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_orders (
  sales_order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id),
  order_type TEXT NOT NULL CHECK (order_type IN ('DIRECT_ORDER', 'MARKETPLACE')),
  status TEXT NOT NULL DEFAULT 'NEW_ORDER' CHECK (status IN ('NEW_ORDER', 'READY_PRODUCTION', 'IN_PRODUCTION', 'PACKING', 'RTS', 'COMPLETED', 'INACTIVE')),
  order_date DATE,
  deadline DATE,
  priority TEXT,
  marketplace TEXT,
  marketplace_customer TEXT,
  tracking_number TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  so_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(sales_order_id),
  product_id BIGINT REFERENCES products(product_id),
  item_code TEXT,
  product_name TEXT,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(sales_order_id),
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  work_order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(sales_order_id),
  so_item_id BIGINT NOT NULL REFERENCES sales_order_items(so_item_id),
  work_order_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'READY_PRODUCTION' CHECK (status IN ('READY_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT work_order_item_belongs_to_order UNIQUE (sales_order_id, so_item_id, work_order_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_work_orders_active_so_item
  ON work_orders (sales_order_id, so_item_id)
  WHERE status <> 'INACTIVE';

CREATE TABLE IF NOT EXISTS production_records (
  production_record_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  work_order_id BIGINT NOT NULL REFERENCES work_orders(work_order_id),
  status TEXT NOT NULL DEFAULT 'READY_PRODUCTION' CHECK (status IN ('READY_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fulfillment (
  fulfillment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(sales_order_id),
  packing_completed_at TIMESTAMPTZ,
  rts_at TIMESTAMPTZ,
  handover_at TIMESTAMPTZ,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sales_order_id)
);

CREATE TABLE IF NOT EXISTS audit_records (
  audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS ix_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS ix_sales_orders_order_type ON sales_orders(order_type);
CREATE INDEX IF NOT EXISTS ix_sales_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS ix_payments_order ON payments(sales_order_id);
CREATE INDEX IF NOT EXISTS ix_work_orders_order ON work_orders(sales_order_id, so_item_id);
CREATE INDEX IF NOT EXISTS ix_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS ix_production_work_order_status ON production_records(work_order_id, status);
CREATE INDEX IF NOT EXISTS ix_fulfillment_order ON fulfillment(sales_order_id);
CREATE INDEX IF NOT EXISTS ix_audit_entity ON audit_records(entity_type, entity_id, created_at);

COMMIT;
