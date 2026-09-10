# Authorization Matrix

## 1. Access Levels
The backend uses a strict role-based access control (RBAC) mechanism.

| Category | Auth Requirement | Access Control Middleware | Typical Use Case |
|---|---|---|---|
| **PUBLIC** | None | None | Viewing products, submitting reviews, webhooks, registration. |
| **CUSTOMER** | User JWT | `authenticate` | Placing orders, managing profile/cart. |
| **ADMIN** | Admin JWT | `authenticateAdmin` or `authorize(Role.ADMIN)` | Managing products, viewing users, handling orders. |
| **SUPER_ADMIN**| Admin JWT + Role | `requireSuperAdmin` | System configurations, managing other admins. |

## 2. Enforcement Mechanisms
- **Customers**: Authenticated via standard `access_token` cookie or `Authorization: Bearer <token>`. Verified using `JWT_ACCESS_SECRET` in `auth.middleware.ts`.
- **Admins**: Authenticated via `admin_access_token` cookie or `Authorization: Bearer <token>`. Verified using `ADMIN_JWT_SECRET` in `adminAuth.middleware.ts`. The payload type claim must equal `"admin"`.

## 3. Boundary Violations Prevented
- **Customer cannot access admin endpoints**: Admin endpoints verify the token against `ADMIN_JWT_SECRET` and explicitly check `type === "admin"`. Customers using user tokens will be rejected.
- **Customer cannot see other customers' data**: Controllers extract `req.auth.id` directly from the validated JWT token rather than trusting `req.body.userId` to perform modifications to profile/cart/orders.
- **Admin cannot do super-admin only operations**: `requireSuperAdmin` explicitly checks `req.admin.role === "SUPER_ADMIN"`. Regular admins are denied.
- **Public cannot mutate any data**: Protected routes use `.use(authenticate)` or `.use(authenticateAdmin)` to fail unauthorized mutations.
