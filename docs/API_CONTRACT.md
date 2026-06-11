# API Contract (Draft)

## Auth
- POST /auth/login
- POST /auth/refresh

## Users
- GET /users
- POST /users
- PATCH /users/:id

## Services
- GET /services
- POST /services
- PATCH /services/:id

## Tickets
- POST /tickets
- GET /tickets/next
- POST /tickets/:id/call
- POST /tickets/:id/recall
- POST /tickets/:id/skip
- POST /tickets/:id/complete

## Reports
- GET /reports/summary
- GET /reports/history
