# 🍱 Meal-Box API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require: `Authorization: Bearer <accessToken>`

---

## AUTH ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | Private | Logout |
| GET | `/auth/profile` | Private | Get profile |
| PUT | `/auth/profile` | Private | Update profile |
| PUT | `/auth/change-password` | Private | Change password |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password/:token` | Public | Reset password |

---

## CATEGORY ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Public | Get all categories |
| GET | `/categories/:id` | Public | Get single category |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |

---

## PRODUCT ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/products` | Public | Get all products (with filters/search/sort/pagination) |
| GET | `/products/popular` | Public | Get popular products |
| GET | `/products/:id` | Public | Get product details |
| POST | `/products` | Admin | Create product (multipart with images) |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Delete product |
| PATCH | `/products/:id/availability` | Admin | Toggle availability |

**Query Parameters for GET /products:**
- `search` - Search in name/description/tags
- `categoryId` - Filter by category
- `isVeg` - true/false
- `isAvailable` - true/false
- `sort` - e.g. `-price`, `rating`, `-totalOrders`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

---

## CART ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/cart` | Private | Get cart |
| POST | `/cart/add` | Private | Add item |
| PUT | `/cart/update` | Private | Update quantity |
| DELETE | `/cart/remove/:productId` | Private | Remove item |
| DELETE | `/cart/clear` | Private | Clear cart |
| POST | `/cart/apply-coupon` | Private | Apply coupon |
| DELETE | `/cart/remove-coupon` | Private | Remove coupon |

---

## ORDER ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/orders` | Customer | Place order |
| GET | `/orders` | Private | My orders |
| GET | `/orders/:id` | Private | Order details |
| PUT | `/orders/:id/cancel` | Customer | Cancel order |
| GET | `/orders/admin/all` | Admin | All orders |
| PUT | `/orders/:id/status` | Admin | Update status |

**Order Status Flow:** `pending  → preparing → out_for_delivery → delivered`

---

## PAYMENT ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/payments/create-order` | Private | Create Razorpay order |
| POST | `/payments/verify` | Private | Verify payment |

---

## ADMIN ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/dashboard` | Admin | Dashboard stats |
| GET | `/admin/analytics` | Admin | Revenue analytics |
| GET | `/admin/users` | Admin | All users |
| PUT | `/admin/users/:id/block` | Admin | Block/Unblock user |
| GET | `/admin/delivery-boys` | Admin | Delivery boys |
| PUT | `/admin/orders/:orderId/assign` | Admin | Assign delivery boy |

---

## DELIVERY ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/delivery/orders` | Delivery | My assigned orders |
| PUT | `/delivery/orders/:id/status` | Delivery | Update status |

---

## OFFER ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/offers` | Public | Active offers |
| POST | `/offers/validate` | Private | Validate coupon |
| GET | `/offers/admin/all` | Admin | All offers |
| POST | `/offers` | Admin | Create offer |
| PUT | `/offers/:id` | Admin | Update offer |
| DELETE | `/offers/:id` | Admin | Delete offer |

---

## REVIEW ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/reviews/product/:productId` | Public | Product reviews |
| POST | `/reviews` | Private | Add review |
| DELETE | `/reviews/:id` | Private | Delete review |

---

## ADDRESS ENDPOINTS

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/addresses` | Private | My addresses |
| POST | `/addresses` | Private | Add address |
| PUT | `/addresses/:id` | Private | Update address |
| DELETE | `/addresses/:id` | Private | Delete address |
| PUT | `/addresses/:id/set-default` | Private | Set default |
