-- ═══════════════════════════════════════════════════════
--  TOURFLOW CRM — MYSQL 8.0+ COMPATIBLE SCHEMA
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS tourflow_crm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tourflow_crm;


-- ═══════════════════════════════════════════════════════
--  TABLE: master_lookup
--  (Replaces PostgreSQL ENUM types — single source of truth)
-- ═══════════════════════════════════════════════════════

CREATE TABLE master_lookup (
    id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    type        VARCHAR(50)   NOT NULL,
    code        VARCHAR(50)   NOT NULL,
    label       VARCHAR(100)  NOT NULL,
    sort_order  SMALLINT      NOT NULL DEFAULT 0,
    is_active   TINYINT(1)    NOT NULL DEFAULT 1,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_type_code (type, code)
);

CREATE INDEX idx_master_lookup_type ON master_lookup(type);

INSERT INTO master_lookup (type, code, label, sort_order) VALUES
-- customer_tier
('customer_tier', 'Platinum', 'Platinum', 1),
('customer_tier', 'Gold',     'Gold',     2),
('customer_tier', 'Silver',   'Silver',   3),
('customer_tier', 'Bronze',   'Bronze',   4),
-- lead_source
('lead_source', 'WhatsApp', 'WhatsApp', 1),
('lead_source', 'Website',  'Website',  2),
('lead_source', 'Referral', 'Referral', 3),
('lead_source', 'Walk-in',  'Walk-in',  4),
('lead_source', 'Social',   'Social',   5),
('lead_source', 'Other',    'Other',    6),
-- enquiry_status
('enquiry_status', 'New',           'New',           1),
('enquiry_status', 'Contacted',     'Contacted',     2),
('enquiry_status', 'Qualified',     'Qualified',     3),
('enquiry_status', 'Proposal Sent', 'Proposal Sent', 4),
('enquiry_status', 'Won',           'Won',           5),
('enquiry_status', 'Lost',          'Lost',          6),
('enquiry_status', 'On Hold',       'On Hold',       7),
-- booking_status
('booking_status', 'Confirmed',    'Confirmed',    1),
('booking_status', 'Advance Paid', 'Advance Paid', 2),
('booking_status', 'Fully Paid',   'Fully Paid',   3),
('booking_status', 'Cancelled',    'Cancelled',    4),
('booking_status', 'Refunded',     'Refunded',     5),
-- quotation_status
('quotation_status', 'Draft',    'Draft',    1),
('quotation_status', 'Sent',     'Sent',     2),
('quotation_status', 'Approved', 'Approved', 3),
('quotation_status', 'Rejected', 'Rejected', 4),
('quotation_status', 'Expired',  'Expired',  5),
-- invoice_status
('invoice_status', 'Draft',     'Draft',     1),
('invoice_status', 'Sent',      'Sent',      2),
('invoice_status', 'Partial',   'Partial',   3),
('invoice_status', 'Paid',      'Paid',      4),
('invoice_status', 'Overdue',   'Overdue',   5),
('invoice_status', 'Cancelled', 'Cancelled', 6),
-- user_role
('user_role', 'SuperAdmin', 'Super Admin', 1),
('user_role', 'Admin',      'Admin',       2),
('user_role', 'Agent',      'Agent',       3),
-- package_status
('package_status', 'Active',   'Active',   1),
('package_status', 'Inactive', 'Inactive', 2),
('package_status', 'Archived', 'Archived', 3);


-- ═══════════════════════════════════════════════════════
--  TABLE: users
-- ═══════════════════════════════════════════════════════

CREATE TABLE users (
    id            CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
    name          VARCHAR(120)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash TEXT          NOT NULL,
    role          ENUM('SuperAdmin','Admin','Agent') NOT NULL DEFAULT 'Agent',
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    avatar_url    TEXT,
    phone         VARCHAR(30),
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ═══════════════════════════════════════════════════════
--  TABLE: customers
-- ═══════════════════════════════════════════════════════

CREATE TABLE customers (
    id                CHAR(12)     NOT NULL PRIMARY KEY,
    name              VARCHAR(180) NOT NULL,
    email             VARCHAR(255) UNIQUE,
    phone             VARCHAR(30),
    city              VARCHAR(100),
    country           VARCHAR(100),
    source            ENUM('WhatsApp','Website','Referral','Walk-in','Social','Other') NOT NULL DEFAULT 'Other',
    tier              ENUM('Platinum','Gold','Silver','Bronze') NOT NULL DEFAULT 'Bronze',
    tags              JSON,
    notes             TEXT,
    assigned_agent_id CHAR(36)     REFERENCES users(id),
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_agent FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_customers_agent  ON customers(assigned_agent_id);
CREATE INDEX idx_customers_tier   ON customers(tier);
CREATE INDEX idx_customers_source ON customers(source);


-- ═══════════════════════════════════════════════════════
--  TABLE: enquiries
-- ═══════════════════════════════════════════════════════

CREATE TABLE enquiries (
    id                CHAR(12)    NOT NULL PRIMARY KEY,
    customer_id       CHAR(12)    NOT NULL,
    destination       VARCHAR(200) NOT NULL,
    pax               SMALLINT    NOT NULL CHECK (pax > 0),
    budget            DECIMAL(12,2),
    budget_currency   CHAR(3)     DEFAULT 'INR',
    source            ENUM('WhatsApp','Website','Referral','Walk-in','Social','Other'),
    status            ENUM('New','Contacted','Qualified','Proposal Sent','Won','Lost','On Hold') NOT NULL DEFAULT 'New',
    assigned_agent_id CHAR(36),
    travel_date_from  DATE,
    travel_date_to    DATE,
    converted_at      DATETIME,
    created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_enquiries_customer FOREIGN KEY (customer_id)       REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_enquiries_agent    FOREIGN KEY (assigned_agent_id) REFERENCES users(id)     ON DELETE SET NULL
);

CREATE TABLE enquiry_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    enquiry_id  CHAR(12)     NOT NULL,
    logged_by   CHAR(36),
    log_type    VARCHAR(50)  NOT NULL,
    note        TEXT,
    old_status  ENUM('New','Contacted','Qualified','Proposal Sent','Won','Lost','On Hold'),
    new_status  ENUM('New','Contacted','Qualified','Proposal Sent','Won','Lost','On Hold'),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enqlogs_enquiry   FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
    CONSTRAINT fk_enqlogs_logged_by FOREIGN KEY (logged_by)  REFERENCES users(id)     ON DELETE SET NULL
);

CREATE INDEX idx_enquiries_customer ON enquiries(customer_id);
CREATE INDEX idx_enquiries_agent    ON enquiries(assigned_agent_id);
CREATE INDEX idx_enquiries_status   ON enquiries(status);
CREATE INDEX idx_enq_logs_enquiry   ON enquiry_logs(enquiry_id);


-- ═══════════════════════════════════════════════════════
--  TABLE: travel_packages
-- ═══════════════════════════════════════════════════════

CREATE TABLE travel_packages (
    id            CHAR(12)      NOT NULL PRIMARY KEY,
    name          VARCHAR(255)  NOT NULL UNIQUE,
    description   TEXT,
    destination   VARCHAR(200),
    duration_days SMALLINT      CHECK (duration_days > 0),
    price         DECIMAL(12,2) NOT NULL,
    cost          DECIMAL(12,2) NOT NULL,
    currency      CHAR(3)       NOT NULL DEFAULT 'INR',
    status        ENUM('Active','Inactive','Archived') NOT NULL DEFAULT 'Active',
    inclusions    JSON,
    exclusions    JSON,
    created_by    CHAR(36),
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_packages_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ═══════════════════════════════════════════════════════
--  TABLE: itineraries
-- ═══════════════════════════════════════════════════════

CREATE TABLE itineraries (
    id          CHAR(12)     NOT NULL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    package_id  CHAR(12)     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_itin_package FOREIGN KEY (package_id) REFERENCES travel_packages(id) ON DELETE CASCADE
);

CREATE TABLE itinerary_days (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    itinerary_id  CHAR(12)     NOT NULL,
    day_number    SMALLINT     NOT NULL CHECK (day_number >= 1),
    title         VARCHAR(255),
    description   TEXT,
    meals         JSON,
    accommodation VARCHAR(255),
    UNIQUE KEY uq_itin_day (itinerary_id, day_number),
    CONSTRAINT fk_itin_days FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

CREATE TABLE itinerary_day_activities (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    day_id        BIGINT       NOT NULL,
    sort_order    SMALLINT     NOT NULL DEFAULT 0,
    activity      TEXT         NOT NULL,
    duration_mins SMALLINT,
    location      VARCHAR(255),
    CONSTRAINT fk_itin_acts FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE
);

CREATE INDEX idx_itin_package ON itineraries(package_id);
CREATE INDEX idx_itin_days    ON itinerary_days(itinerary_id);
CREATE INDEX idx_itin_acts    ON itinerary_day_activities(day_id);


-- ═══════════════════════════════════════════════════════
--  TABLE: quotations
-- ═══════════════════════════════════════════════════════

CREATE TABLE quotations (
    id            CHAR(12)      NOT NULL PRIMARY KEY,
    customer_id   CHAR(12)      NOT NULL,
    enquiry_id    CHAR(12),
    package_id    CHAR(12),
    created_by    CHAR(36),
    status        ENUM('Draft','Sent','Approved','Rejected','Expired') NOT NULL DEFAULT 'Draft',
    valid_until   DATE,
    sub_total     DECIMAL(14,2) NOT NULL DEFAULT 0,
    discount_pct  DECIMAL(5,2)  NOT NULL DEFAULT 0,
    discount_flat DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_pct       DECIMAL(5,2)  NOT NULL DEFAULT 0,
    total_amount  DECIMAL(14,2) NOT NULL DEFAULT 0,
    currency      CHAR(3)       NOT NULL DEFAULT 'INR',
    notes         TEXT,
    sent_at       DATETIME,
    approved_at   DATETIME,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quot_customer FOREIGN KEY (customer_id) REFERENCES customers(id)      ON DELETE RESTRICT,
    CONSTRAINT fk_quot_enquiry  FOREIGN KEY (enquiry_id)  REFERENCES enquiries(id)      ON DELETE SET NULL,
    CONSTRAINT fk_quot_package  FOREIGN KEY (package_id)  REFERENCES travel_packages(id) ON DELETE SET NULL,
    CONSTRAINT fk_quot_created  FOREIGN KEY (created_by)  REFERENCES users(id)          ON DELETE SET NULL
);

CREATE TABLE quotation_items (
    id            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quotation_id  CHAR(12)      NOT NULL,
    sort_order    SMALLINT      NOT NULL DEFAULT 0,
    description   VARCHAR(500)  NOT NULL,
    category      VARCHAR(100),
    unit_price    DECIMAL(12,2) NOT NULL,
    quantity      SMALLINT      NOT NULL DEFAULT 1,
    total_price   DECIMAL(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
    CONSTRAINT fk_quot_items FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE TABLE quotation_itinerary_days (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quotation_id  CHAR(12)     NOT NULL,
    day_number    SMALLINT     NOT NULL,
    title         VARCHAR(255),
    description   TEXT,
    UNIQUE KEY uq_quot_day (quotation_id, day_number),
    CONSTRAINT fk_quot_itin_days FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE INDEX idx_quot_customer ON quotations(customer_id);
CREATE INDEX idx_quot_enquiry  ON quotations(enquiry_id);
CREATE INDEX idx_quot_package  ON quotations(package_id);
CREATE INDEX idx_quot_items    ON quotation_items(quotation_id);


-- ═══════════════════════════════════════════════════════
--  TABLE: bookings
-- ═══════════════════════════════════════════════════════

CREATE TABLE bookings (
    id                  CHAR(12)      NOT NULL PRIMARY KEY,
    customer_id         CHAR(12)      NOT NULL,
    enquiry_id          CHAR(12),
    quotation_id        CHAR(12),
    assigned_agent_id   CHAR(36),
    destination         VARCHAR(200)  NOT NULL,
    departure_date      DATE          NOT NULL,
    return_date         DATE,
    pax                 SMALLINT      NOT NULL CHECK (pax > 0),
    amount              DECIMAL(14,2) NOT NULL,
    currency            CHAR(3)       NOT NULL DEFAULT 'INR',
    status              ENUM('Confirmed','Advance Paid','Fully Paid','Cancelled','Refunded') NOT NULL DEFAULT 'Confirmed',
    special_notes       TEXT,
    confirmed_at        DATETIME,
    cancelled_at        DATETIME,
    cancellation_reason TEXT,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_customer  FOREIGN KEY (customer_id)       REFERENCES customers(id)  ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_enquiry   FOREIGN KEY (enquiry_id)        REFERENCES enquiries(id)  ON DELETE SET NULL,
    CONSTRAINT fk_bookings_quotation FOREIGN KEY (quotation_id)      REFERENCES quotations(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_agent     FOREIGN KEY (assigned_agent_id) REFERENCES users(id)      ON DELETE SET NULL
);

CREATE INDEX idx_bookings_customer  ON bookings(customer_id);
CREATE INDEX idx_bookings_enquiry   ON bookings(enquiry_id);
CREATE INDEX idx_bookings_quotation ON bookings(quotation_id);
CREATE INDEX idx_bookings_agent     ON bookings(assigned_agent_id);
CREATE INDEX idx_bookings_departure ON bookings(departure_date);
CREATE INDEX idx_bookings_status    ON bookings(status);


-- ═══════════════════════════════════════════════════════
--  TABLE: invoices
-- ═══════════════════════════════════════════════════════

CREATE TABLE invoices (
    id            CHAR(12)      NOT NULL PRIMARY KEY,
    booking_id    CHAR(12)      NOT NULL,
    customer_id   CHAR(12)      NOT NULL,
    created_by    CHAR(36),
    status        ENUM('Draft','Sent','Partial','Paid','Overdue','Cancelled') NOT NULL DEFAULT 'Draft',
    sub_total     DECIMAL(14,2) NOT NULL,
    tax_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount  DECIMAL(14,2) NOT NULL,
    amount_paid   DECIMAL(14,2) NOT NULL DEFAULT 0,
    currency      CHAR(3)       NOT NULL DEFAULT 'INR',
    due_date      DATE,
    sent_at       DATETIME,
    paid_at       DATETIME,
    notes         TEXT,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)  ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_created  FOREIGN KEY (created_by)  REFERENCES users(id)      ON DELETE SET NULL
);

CREATE TABLE invoice_payments (
    id            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    invoice_id    CHAR(12)      NOT NULL,
    amount        DECIMAL(14,2) NOT NULL,
    payment_mode  VARCHAR(60),
    reference_no  VARCHAR(120),
    paid_on       DATE          NOT NULL DEFAULT (CURRENT_DATE),
    recorded_by   CHAR(36),
    notes         TEXT,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_payments         FOREIGN KEY (invoice_id)  REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_payments_user    FOREIGN KEY (recorded_by) REFERENCES users(id)    ON DELETE SET NULL
);

CREATE INDEX idx_invoices_booking  ON invoices(booking_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status   ON invoices(status);
CREATE INDEX idx_inv_payments      ON invoice_payments(invoice_id);


-- ═══════════════════════════════════════════════════════
--  TRIGGER: Auto-sync invoice amount_paid & status
--  when a payment is inserted, updated, or deleted
-- ═══════════════════════════════════════════════════════

DELIMITER $$

CREATE TRIGGER trg_invoice_payment_after_insert
AFTER INSERT ON invoice_payments
FOR EACH ROW
BEGIN
  UPDATE invoices
  SET
    amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = NEW.invoice_id),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = NEW.invoice_id) >= total_amount THEN 'Paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'Partial'
      ELSE status
    END
  WHERE id = NEW.invoice_id;
END$$

CREATE TRIGGER trg_invoice_payment_after_update
AFTER UPDATE ON invoice_payments
FOR EACH ROW
BEGIN
  UPDATE invoices
  SET
    amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = NEW.invoice_id),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = NEW.invoice_id) >= total_amount THEN 'Paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'Partial'
      ELSE status
    END
  WHERE id = NEW.invoice_id;
END$$

CREATE TRIGGER trg_invoice_payment_after_delete
AFTER DELETE ON invoice_payments
FOR EACH ROW
BEGIN
  UPDATE invoices
  SET
    amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = OLD.invoice_id),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = OLD.invoice_id) >= total_amount THEN 'Paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments WHERE invoice_id = OLD.invoice_id) > 0 THEN 'Partial'
      ELSE status
    END
  WHERE id = OLD.invoice_id;
END$$

DELIMITER ;
