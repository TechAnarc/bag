# API Integration Matrix

## 1. Auth Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| POST | /api/v1/auth/register | NONE | NONE | Direct user registration | PUBLIC |
| POST | /api/v1/auth/login | NONE | NONE | Direct user login | PUBLIC |
| POST | /api/v1/auth/request-otp | NONE | NONE | Request Mobile OTP | PUBLIC |
| POST | /api/v1/auth/verify-otp | NONE | NONE | Verify Mobile OTP | PUBLIC |
| POST | /api/v1/auth/google-login | NONE | NONE | Google Auth | PUBLIC |
| POST | /api/v1/auth/supabase-login | NONE | NONE | Supabase Auth fallback | PUBLIC |
| POST | /api/v1/auth/refresh | NONE | NONE | Refresh token | PUBLIC |
| POST | /api/v1/auth/logout | NONE | NONE | Logout user | PUBLIC |

## 2. Admin Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| POST | /api/v1/admin/auth/login | NONE | NONE | Admin login | PUBLIC |
| POST | /api/v1/admin/auth/google-login | NONE | NONE | Admin Google login | PUBLIC |
| POST | /api/v1/admin/auth/refresh | NONE | NONE | Admin refresh token | PUBLIC |
| POST | /api/v1/admin/auth/logout | NONE | NONE | Admin logout | PUBLIC |
| GET | /api/v1/admin/profile | Admin JWT | ADMIN | Get admin profile | ADMIN |
| PUT | /api/v1/admin/profile | Admin JWT | ADMIN | Update admin profile | ADMIN |
| PUT | /api/v1/admin/profile/password | Admin JWT | ADMIN | Update admin password | ADMIN |
| POST | /api/v1/admin/mobile/register-device | Admin JWT | ADMIN | Register mobile device | ADMIN |
| GET | /api/v1/admin/stats/dashboard | Admin JWT | ADMIN | Dashboard statistics | ADMIN |
| GET | /api/v1/admin/stats/charts | Admin JWT | ADMIN | Chart data | ADMIN |
| GET | /api/v1/admin/analytics | Admin JWT | ADMIN | Analytics data | ADMIN |
| GET | /api/v1/admin/users | Admin JWT | ADMIN | List all users | ADMIN |
| PUT | /api/v1/admin/users/:userId/block | Admin JWT | ADMIN | Block user | ADMIN |
| PUT | /api/v1/admin/users/:userId/unblock | Admin JWT | ADMIN | Unblock user | ADMIN |
| GET | /api/v1/admin/orders | Admin JWT | ADMIN | List orders | ADMIN |
| GET | /api/v1/admin/products | Admin JWT | ADMIN | List products | ADMIN |
| POST | /api/v1/admin/products | Admin JWT | ADMIN | Create product | ADMIN |
| PUT | /api/v1/admin/products/:productId | Admin JWT | ADMIN | Update product | ADMIN |
| DELETE | /api/v1/admin/products/:productId | Admin JWT | ADMIN | Delete product | ADMIN |
| GET | /api/v1/admin/inquiries | Admin JWT | ADMIN | List inquiries | ADMIN |
| GET | /api/v1/admin/logs | Admin JWT | ADMIN | View activity logs | ADMIN |
| GET | /api/v1/admin/settings/business | Admin JWT | ADMIN | View business settings | ADMIN |
| PUT | /api/v1/admin/settings/business | Admin JWT | ADMIN | Update business settings | ADMIN |

## 3. Product Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| GET | /api/v1/products/generate-sku | Admin JWT | ADMIN | Auto-generate SKU | ADMIN |
| POST | /api/v1/products/generate-tagline | Admin JWT | ADMIN | AI generate tagline | ADMIN |
| POST | /api/v1/products/upload-images | Admin JWT | ADMIN | Upload product images | ADMIN |
| GET | /api/v1/products | NONE | NONE | List all products | PUBLIC |
| GET | /api/v1/products/search | NONE | NONE | Search products | PUBLIC |
| GET | /api/v1/products/slug/:slug | NONE | NONE | Get product by slug | PUBLIC |
| GET | /api/v1/products/:id | NONE | NONE | Get product by ID | PUBLIC |
| POST | /api/v1/products | Admin JWT | ADMIN | Create product | ADMIN |
| PUT | /api/v1/products/:id | Admin JWT | ADMIN | Update product | ADMIN |
| DELETE | /api/v1/products/:id | Admin JWT | ADMIN | Delete product | ADMIN |

## 4. Order Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| POST | /api/v1/orders | JWT | CUSTOMER | Create order | CUSTOMER |
| POST | /api/v1/orders/verify-payment | JWT | CUSTOMER | Verify payment | CUSTOMER |
| GET | /api/v1/orders/my-orders | JWT | CUSTOMER | Get user orders | CUSTOMER |
| GET | /api/v1/orders/:id | JWT | CUSTOMER | Get order by ID | CUSTOMER |
| GET | /api/v1/orders | JWT | ADMIN | List all orders | ADMIN |
| PATCH | /api/v1/orders/:id/status | JWT | ADMIN | Update order status | ADMIN |

## 5. Cart Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| GET | /api/v1/cart | JWT | CUSTOMER | Get user cart | CUSTOMER |
| POST | /api/v1/cart/calculate | NONE | NONE | Calculate cart totals | PUBLIC |
| POST | /api/v1/cart/items | JWT | CUSTOMER | Add item to cart | CUSTOMER |
| PUT | /api/v1/cart/items/:id | JWT | CUSTOMER | Update item quantity | CUSTOMER |
| DELETE | /api/v1/cart/items/:id | JWT | CUSTOMER | Remove item from cart | CUSTOMER |
| DELETE | /api/v1/cart | JWT | CUSTOMER | Clear cart | CUSTOMER |

## 6. Review Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| POST | /api/v1/reviews | NONE | NONE | Submit review | PUBLIC |
| GET | /api/v1/reviews/product/:productId/stats | NONE | NONE | Get review stats | PUBLIC |
| GET | /api/v1/reviews/product/:productId | NONE | NONE | Get reviews for product | PUBLIC |
| GET | /api/v1/reviews/admin | Admin JWT | ADMIN | List all reviews | ADMIN |
| PATCH | /api/v1/reviews/admin/:id/status | Admin JWT | ADMIN | Update review status | ADMIN |
| DELETE | /api/v1/reviews/admin/:id | Admin JWT | ADMIN | Delete review | ADMIN |

## 7. Category Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| GET | /api/v1/categories | NONE | NONE | List all categories | PUBLIC |
| GET | /api/v1/categories/:id | NONE | NONE | Get category by ID | PUBLIC |
| POST | /api/v1/categories | Admin JWT | ADMIN | Create category | ADMIN |
| PUT | /api/v1/categories/:id | Admin JWT | ADMIN | Update category | ADMIN |
| DELETE | /api/v1/categories/:id | Admin JWT | ADMIN | Delete category | ADMIN |

## 8. Contact Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| POST | /api/v1/contact | NONE | NONE | Submit contact form | PUBLIC |
| GET | /api/v1/contact | Admin JWT | ADMIN | List submissions | ADMIN |
| PATCH | /api/v1/contact/:id/read | Admin JWT | ADMIN | Mark as read | ADMIN |
| POST | /api/v1/contact/:id/reply | Admin JWT | ADMIN | Reply to submission | ADMIN |

## 9. Profile Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| GET | /api/v1/profile/me | JWT | CUSTOMER | Get user profile | CUSTOMER |
| PUT | /api/v1/profile | JWT | CUSTOMER | Update profile | CUSTOMER |
| POST | /api/v1/profile/addresses | JWT | CUSTOMER | Add address | CUSTOMER |
| PUT | /api/v1/profile/addresses/:addressId | JWT | CUSTOMER | Update address | CUSTOMER |
| DELETE | /api/v1/profile/addresses/:addressId | JWT | CUSTOMER | Delete address | CUSTOMER |
| POST | /api/v1/profile/change-password | JWT | CUSTOMER | Change password | CUSTOMER |
| DELETE | /api/v1/profile | JWT | CUSTOMER | Delete account | CUSTOMER |

## 10. UPIs Admin Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| GET | /api/v1/admin/upis/users | Admin JWT | ADMIN | List UPI users | ADMIN |
| GET | /api/v1/admin/upis/visitor-radar | Admin JWT | ADMIN | Visitor radar | ADMIN |
| GET | /api/v1/admin/upis/users/:id/intelligence | Admin JWT | ADMIN | User Intelligence | ADMIN |

## 11. Payments Module
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| POST | /api/v1/payments/webhook | NONE | NONE | Razorpay Webhook | PUBLIC |
| GET | /api/v1/payments/webhook/health | NONE | NONE | Webhook Health | PUBLIC |
| GET | /api/v1/payments/webhook/registry | JWT | ADMIN | Registry | ADMIN |
| GET | /api/v1/payments/:paymentId | JWT | ADMIN | Fetch Payment Details | ADMIN |
| POST | /api/v1/payments/:paymentId/refund | JWT | ADMIN | Refund Payment | ADMIN |

## 12. System / Health
| METHOD | PATH | AUTH | ROLE | DESCRIPTION | ACCESS LEVEL |
|---|---|---|---|---|---|
| GET | /health | NONE | NONE | Minimal Health | PUBLIC |
| GET | /api/v1/health | NONE | NONE | Render Health Alias | PUBLIC |
| GET | /health/diagnostics | NONE | NONE | Diagnostics | PUBLIC |
| GET | / | NONE | NONE | API Root | PUBLIC |
