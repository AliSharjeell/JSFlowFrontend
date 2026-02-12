# API Endpoints Documentation

This document lists all available API endpoints for the Banking Agent backend, including their input payloads and response formats.

## 1. Accounts

### Get Account Balance
**Endpoint:** `GET /api/v1/accounts/balance`
**Description:** Returns the current account balance and status.
**Input:** None
**Output:**
```json
{
  "account_id": "uuid-string",
  "currency": "PKR",
  "available_balance": 50000.0,
  "ledger_balance": 50000.0,
  "status": "ACTIVE"
}
```

### Account Action (Freeze/Unfreeze)
**Endpoint:** `POST /api/v1/accounts/action`
**Description:** Freeze or unfreeze the entire account.
**Input:**
```json
{
  "action": "freeze",  // or "unfreeze"
  "pin": "1234"
}
```
**Output:**
```json
{
  "message": "Account has been verified and FROZEN. contact support to unfreeze.",
  "status": "FROZEN"
}
```

---

## 2. Transactions

### Get Transactions
**Endpoint:** `GET /api/v1/transactions`
**Query Parameters:**
- [limit](file:///c:/Apps%20New/ProcomHackathon26_backend/routers/cards.py#99-136) (int, default=10)
- `category` (string, optional: "FOOD", "TRANSFER", "BILL_PAY", etc.)
- `start_date` (string, ISO format YYYY-MM-DD)
- `end_date` (string, ISO format YYYY-MM-DD)

**Input:** None
**Output:**
```json
{
  "data": [
    {
      "id": "uuid-string",
      "type": "TRANSFER",
      "amount": 5000.0,
      "recipient_name": "Ali Khan",
      "category": "transfer",
      "date": "2026-02-06T10:30:00",
      "status": "settled"
    }
  ],
  "count": 1
}
```

---

## 3. Transfers

### Preview Transfer
**Endpoint:** `POST /api/v1/transfers/preview`
**Description:** Dry run to check fees and validate recipient before sending.
**Input:**
```json
{
  "recipient_id": "Ali Khan", // Name, Nickname, or Account Number
  "amount": 5000.0,
  "note": "Lunch money"
}
```
**Output:**
```json
{
  "recipient_name": "Ali Khan",
  "bank": "Procom Bank",
  "account_number": "PK99HBL...",
  "amount": 5000.0,
  "fee": 0.0,
  "total_deduction": 5000.0,
  "your_balance_after": 45000.0,
  "warning": null
}
```

### Execute Transfer
**Endpoint:** `POST /api/v1/transfers`
**Headers:** `X-Idempotency-Key` (Required unique string)
**Description:** Executes the money transfer.
**Input:**
```json
{
  "recipient_id": "Ali Khan",
  "amount": 5000.0,
  "note": "Lunch money",
  "pin": "1234"
}
```
**Output:**
```json
{
  "transfer_id": "uuid-string",
  "status": "success",
  "recipient_name": "Ali Khan",
  "amount": 5000.0,
  "new_balance": 45000.0,
  "timestamp": "2026-02-06T10:31:00"
}
```

---

## 4. Bill Payments

### List Saved Billers
**Endpoint:** `GET /api/v1/billers`
**Input:** None
**Output:**
```json
[
  {
    "id": "uuid-string",
    "name": "Home Electricity",
    "provider_slug": "k-electric",
    "consumer_number": "0400012345678",
    "category": "utility"
  }
]
```

### Save New Biller
**Endpoint:** `POST /api/v1/billers`
**Input:**
```json
{
  "provider_slug": "k-electric",
  "consumer_number": "0400012345678",
  "nickname": "Home Electricity"
}
```
**Output:**
```json
{
  "id": "uuid-string",
  "status": "active",
  "message": "Linked Home Electricity (k-electric) successfully."
}
```

### Pay Bill
**Endpoint:** `POST /api/v1/payments/bill`
**Headers:** `X-Idempotency-Key` (Required unique string)
**Description:** Pay a bill using a saved ID OR a consumer number.
**Input (Option 1 - Saved Biller):**
```json
{
  "biller_id": "uuid-string",
  "amount": 8500.0, // Optional, defaults to invoice amount
  "biller_name": "", // Optional
  "consumer_number": "" // Optional
}
```
*Note based on code analysis: The `Pay Bill` endpoint receives a [BillPaymentRequest](file:///c:/Apps%20New/ProcomHackathon26_backend/schemas.py#76-81) which does not strictly require a PIN in its schema definition ([schemas.py](file:///c:/Apps%20New/ProcomHackathon26_backend/schemas.py)), but authorization and account status checks are still performed.*

**Input (Option 2 - Ad-hoc):**
```json
{
  "consumer_number": "0400012345678",
  "biller_name": "K-Electric", 
  "amount": 8500.0
}
```
**Output:**
```json
{
  "transaction_id": "uuid-string",
  "status": "success",
  "provider": "K-Electric",
  "consumer_number": "0400012345678",
  "amount_paid": 8500.0,
  "new_balance": 41500.0,
  "timestamp": "2026-02-06T10:45:00"
}
```

---

## 5. Cards

### Create Virtual Card
**Endpoint:** `POST /api/v1/cards/virtual`
**Input:**
```json
{
  "label": "Netflix Trial",
  "limit": 100.0,
  "pin": "1234"
}
```
**Output:**
```json
{
  "card_id": "uuid-string",
  "label": "Netflix Trial",
  "pan": "4000 1234 5678 9000",
  "expiry": "12/28",
  "cvv": "123",
  "spend_limit": 100.0,
  "status": "ACTIVE",
  "message": "Virtual card 'Netflix Trial' created with PKR 100.0 limit."
}
```

### Card Action (Freeze/Unfreeze)
**Endpoint:** `POST /api/v1/cards/{card_id}/action`
**Input:**
```json
{
  "action": "freeze", // or "unfreeze"
  "pin": "1234",
  "reason": "lost card" // Optional
}
```
**Output:**
```json
{
  "card_id": "uuid-string",
  "status": "FROZEN",
  "message": "Card has been frozen successfully.",
  "updated_at": "user-uuid" 
}
```

### Update Card Limit
**Endpoint:** `PUT /api/v1/cards/{card_id}/limit`
**Input:**
```json
{
  "amount": 2000.0,
  "limit_type": "daily", // Optional, default "daily"
  "pin": "1234"
}
```
**Output:**
```json
{
  "card_id": "uuid-string",
  "status": "limit_updated",
  "limit_type": "daily",
  "old_limit": 50000.0,
  "new_limit": 2000.0,
  "message": "Card limit updated to PKR 2000.0."
}
```

### Change PIN
**Endpoint:** `PUT /api/v1/cards/{card_id}/pin`
**Input:**
```json
{
  "current_pin": "1234",
  "new_pin": "5678"
}
```
**Output:**
```json
{
  "status": "pin_updated",
  "message": "Your PIN has been changed successfully."
}
```

---

## 6. Contacts

### List Contacts
**Endpoint:** `GET /api/v1/contacts`
**Input:** None
**Output:**
```json
[
  {
    "id": "uuid-string",
    "name": "Ali Khan",
    "nickname": "Ali",
    "bank": "Procom Bank",
    "account_no": "PK99HBL..."
  }
]
```

### Create Contact
**Endpoint:** `POST /api/v1/contacts`
**Input:**
```json
{
  "account_number": "PK99HBL...",
  "name": "Ali Khan", // Optional, will auto-resolve if internal
  "nickname": "Ali",
  "bank_name": "Procom Bank" // Optional
}
```
**Output:**
```json
{
  "id": "uuid-string",
  "name": "Ali Khan",
  "bank": "Procom Bank",
  "message": "Verified and saved Ali Khan to your contacts."
}
```

---

## 7. Analytics

### Get Spending Analytics
**Endpoint:** `GET /api/v1/analytics/spend`
**Query Parameters:**
- `period` (string: "last_week", "last_month", "last_3_months")
- `category` (string, optional)

**Input:** None
**Output:**
```json
{
  "period": "last_month",
  "total_spend": 12500.0,
  "transaction_count": 5,
  "top_category": "food",
  "category_breakdown": {
    "food": 8500.0,
    "transport": 4000.0
  },
  "change_vs_previous_period": "+15%"
}
```
