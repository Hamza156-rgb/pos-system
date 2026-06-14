# API Reference

Base URL: `http://localhost:5000/api`

All responses follow this envelope:

```json
{ "success": true, "message": "Success", "data": { } }
```

Paginated endpoints return `{ "success": true, "data": [...], "pagination": { "total", "page", "limit", "totalPages" } }`.

## Authentication

Send the access token on protected routes:

```
Authorization: Bearer <accessToken>
```

| Method | Endpoint            | Role  | Description                              |
|--------|---------------------|-------|------------------------------------------|
| POST   | `/auth/login`       | —     | `{ email, password }` → access + refresh |
| POST   | `/auth/refresh`     | —     | `{ refreshToken }` → new access token    |
| POST   | `/auth/logout`      | any   | Invalidate session (audit logged)        |
| GET    | `/auth/me`          | any   | Current user profile                     |

The login route is rate-limited (50 requests / 15 min). All `/api` routes share a 1000 / 15 min limiter.

## Users (admin)

| Method | Endpoint      | Description        |
|--------|---------------|--------------------|
| GET    | `/users`      | List users         |
| POST   | `/users`      | Create user        |
| PUT    | `/users/:id`  | Update user        |
| DELETE | `/users/:id`  | Delete user        |

## Categories

| Method | Endpoint           | Role  |
|--------|--------------------|-------|
| GET    | `/categories`      | any   |
| POST   | `/categories`      | admin |
| PUT    | `/categories/:id`  | admin |
| DELETE | `/categories/:id`  | admin |

## Products

| Method | Endpoint                    | Role  | Notes                                            |
|--------|-----------------------------|-------|--------------------------------------------------|
| GET    | `/products`                 | any   | `?page&limit&search&categoryId&status&lowStock`  |
| GET    | `/products/:id`             | any   |                                                  |
| GET    | `/products/barcode/:barcode`| any   | Barcode lookup (POS)                             |
| GET    | `/products/export`          | admin | CSV download                                     |
| POST   | `/products/import`          | admin | multipart `file` field (CSV)                    |
| POST   | `/products`                 | admin | Auto SKU/barcode if omitted                     |
| PUT    | `/products/:id`             | admin |                                                  |
| DELETE | `/products/:id`             | admin |                                                  |

## Inventory

| Method | Endpoint                | Role  | Notes                                  |
|--------|-------------------------|-------|----------------------------------------|
| GET    | `/inventory/movements`  | any   | `?page&limit&productId`                |
| GET    | `/inventory/low-stock`  | any   | Products at/below reorder level        |
| POST   | `/inventory/adjust`     | admin | `{ productId, type, quantity, reason }` — type: `in`/`out`/`adjustment` |

## Suppliers (admin)

`GET /suppliers`, `GET /suppliers/:id` (with purchase history), `POST`, `PUT /:id`, `DELETE /:id`.

## Purchases (admin)

| Method | Endpoint                 | Notes                                                        |
|--------|--------------------------|--------------------------------------------------------------|
| GET    | `/purchases`             | List                                                         |
| GET    | `/purchases/:id`         | With line items                                              |
| POST   | `/purchases`             | `{ supplierId, taxPercentage, status, items:[{productId,quantity,purchasePrice}] }` |
| POST   | `/purchases/:id/receive` | Marks received and stocks in                                 |
| POST   | `/purchases/:id/cancel`  | Cancels a pending order                                      |

## Customers

| Method | Endpoint                | Role  | Notes                            |
|--------|-------------------------|-------|----------------------------------|
| GET    | `/customers`            | any   | `?search`                        |
| GET    | `/customers/:id`        | any   | With sales history + totals      |
| POST   | `/customers`            | any   |                                  |
| PUT    | `/customers/:id`        | any   |                                  |
| POST   | `/customers/:id/settle` | any   | `{ amount }` — Udhaar repayment  |
| DELETE | `/customers/:id`        | admin |                                  |

## Sales

| Method | Endpoint              | Notes                                                        |
|--------|-----------------------|--------------------------------------------------------------|
| GET    | `/sales`              | `?today=true` / `?from&to`                                   |
| GET    | `/sales/:id`          | With items                                                   |
| GET    | `/sales/cash-closing` | Today's cash / card / credit breakdown                       |
| POST   | `/sales`              | Create sale (atomic: stock out + customer credit update)     |
| POST   | `/sales/sync`         | Bulk offline-queue sync (deduped by `offlineId`)             |

Sale body: `{ items:[{productId,quantity,unitPrice}], discount, taxPercentage, paymentMethod, amountPaid, cashAmount, cardAmount, customerId, offlineId }`.

## Reports (admin)

| Method | Endpoint              | Notes                                       |
|--------|-----------------------|---------------------------------------------|
| GET    | `/reports/sales`      | `?period=daily|weekly|monthly|yearly` or `?from&to` |
| GET    | `/reports/inventory`  | Valuation + low-stock                       |
| GET    | `/reports/financial`  | Revenue, COGS, gross profit, margin         |

## Misc

| Method | Endpoint        | Role  |
|--------|-----------------|-------|
| GET    | `/dashboard`    | any   |
| GET    | `/settings`     | any   |
| PUT    | `/settings`     | admin |
| GET    | `/audit-logs`   | admin |
| GET    | `/health`       | —     |

## Error Format

```json
{ "success": false, "message": "Product not found" }
```

Validation errors (express-validator) and Sequelize unique/validation errors are normalized into the same envelope with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).
