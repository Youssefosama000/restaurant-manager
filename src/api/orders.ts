import { api } from "./client";

// ─── MOCK FLAG — set to false when done with screenshots ─────────────────────
const USE_MOCK = false;

const MOCK_TREND: Record<string, TrendSummary> = {
  Today: {
    summary: { totalOrders: 47, totalRevenue: 6840 },
    chartData: [
      { timestamp: "9", orders: 4 }, { timestamp: "10", orders: 7 },
      { timestamp: "11", orders: 11 }, { timestamp: "12", orders: 18 },
      { timestamp: "13", orders: 22 }, { timestamp: "14", orders: 15 },
      { timestamp: "15", orders: 9 },  { timestamp: "16", orders: 6 },
    ],
  },
  Yesterday: {
    summary: { totalOrders: 63, totalRevenue: 9120 },
    chartData: [
      { timestamp: "9", orders: 6 }, { timestamp: "10", orders: 9 },
      { timestamp: "11", orders: 14 }, { timestamp: "12", orders: 21 },
      { timestamp: "13", orders: 28 }, { timestamp: "14", orders: 19 },
      { timestamp: "15", orders: 11 }, { timestamp: "16", orders: 8 },
    ],
  },
  Past7Days: {
    summary: { totalOrders: 318, totalRevenue: 47650 },
    chartData: [
      { timestamp: "Mon", orders: 38 }, { timestamp: "Tue", orders: 45 },
      { timestamp: "Wed", orders: 52 }, { timestamp: "Thu", orders: 61 },
      { timestamp: "Fri", orders: 74 }, { timestamp: "Sat", orders: 89 },
      { timestamp: "Sun", orders: 59 },
    ],
  },
  Past30Days: {
    summary: { totalOrders: 1247, totalRevenue: 183900 },
    chartData: [
      { timestamp: "1", orders: 32 }, { timestamp: "5", orders: 48 },
      { timestamp: "10", orders: 55 }, { timestamp: "15", orders: 67 },
      { timestamp: "20", orders: 71 }, { timestamp: "25", orders: 63 },
      { timestamp: "30", orders: 58 },
    ],
  },
};

const MOCK_ORDERS: Order[] = [
  { id: "ord-8f3a", orderItemsCount: 3, totalAmount: 315, total: 315, status: "Delivered",   createdAt: "2026-06-13T12:14:00Z", customerName: "Layla M." },
  { id: "ord-2c71", orderItemsCount: 1, totalAmount: 125, total: 125, status: "OutForDelivery", createdAt: "2026-06-13T12:31:00Z", customerName: "Omar K." },
  { id: "ord-9d55", orderItemsCount: 4, totalAmount: 480, total: 480, status: "Preparing",   createdAt: "2026-06-13T12:47:00Z", customerName: "Nour A." },
  { id: "ord-1b22", orderItemsCount: 2, totalAmount: 210, total: 210, status: "Pending",     createdAt: "2026-06-13T13:02:00Z", customerName: "Ahmed S." },
  { id: "ord-4e88", orderItemsCount: 2, totalAmount: 270, total: 270, status: "Pending",     createdAt: "2026-06-13T13:15:00Z", customerName: "Sara T." },
];
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus = "Pending" | "Preparing" | "OutForDelivery" | "Delivered";
export type TrendPeriod = "Today" | "Yesterday" | "Past7Days" | "Past30Days";

export interface Order {
  id: string;
  customerName?: string;
  totalAmount?: number;
  total?: number;
  createdAt?: string;
  date?: string;
  status: OrderStatus;
  items?: unknown[];
  orderItemsCount?: number;
  [key: string]: unknown;
}

export interface TrendPoint {
  date?: string;
  day?: string;
  hour?: string;
  time?: string;
  label?: string;
  orders?: number;
  orderCount?: number;
  ordersCount?: number;
  totalOrders?: number;
  count?: number;
  revenue?: number;
  totalRevenue?: number;
  [key: string]: unknown;
}

export interface TrendSummary {
  totalOrders?: number;
  totalRevenue?: number;
  data?: TrendPoint[];
  items?: TrendPoint[];
  [key: string]: unknown;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (USE_MOCK) return;
  await api.patch(`/v1/orders/${orderId}/status`, { Status: status });
}

export async function getOrdersTrend(branchId: string, period: TrendPeriod): Promise<TrendSummary> {
  if (USE_MOCK) return MOCK_TREND[period] ?? MOCK_TREND.Today;
  const res = await api.get<TrendSummary>(
    `/v1/orders/branch/${branchId}/summary?period=${period}`,
    { withRestaurantId: true }
  );
  return res;
}

/**
 * GET /v1/branches/:branchId/orders?page=&pagesize= — list a branch's orders.
 * Response envelope: { total, perPage, currentPage, totalPages, hasNext,
 * hasPrevious, items: [{ orderId, createdAt, orderStatus, totalPrice,
 * orderItemsCount }] }. Normalised to the Order shape the UI consumes, while
 * staying tolerant of a bare array / { items | data } and field casing.
 */
export interface OrderItem {
  id?: string;
  mealName?: string;
  name?: string;
  sizeName?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
  [key: string]: unknown;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  notes?: string;
}

export async function getBranchOrderById(branchId: string, orderId: string): Promise<OrderDetail> {
  const res = await api.get<unknown>(
    `/v1/branches/${branchId}/orders/${orderId}`,
    { withRestaurantId: true }
  );
  const o = res as Record<string, unknown>;

  const rawItems = (Array.isArray(o.orderItems) ? o.orderItems : Array.isArray(o.items) ? o.items : []) as Array<Record<string, unknown>>;

  const items = rawItems.map((item) => {
    const qty       = item.quantity != null ? Number(item.quantity) : 1;
    const unitPrice = Number(item.priceAtOrder ?? item.unitPrice ?? item.price ?? 0);
    return {
      id:         item.id != null ? String(item.id) : undefined,
      mealName:   String(item.mealName ?? item.name ?? item.meal ?? ""),
      sizeName:   item.sizeName != null ? String(item.sizeName) : undefined,
      quantity:   qty,
      unitPrice,
      totalPrice: Number(item.totalPrice ?? item.subTotal ?? (unitPrice * qty)),
    };
  });

  // Total is not in the response — sum from items
  const calculatedTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const total = Number(o.totalPrice ?? o.totalAmount ?? o.total ?? calculatedTotal);

  // deliveryAddress comes as an object {city, area, lat, lng}
  const addr = o.deliveryAddress as Record<string, unknown> | null | undefined;
  const deliveryAddress = addr && typeof addr === "object"
    ? [addr.area, addr.city].filter(Boolean).join(", ") || undefined
    : (o.deliveryAddress != null ? String(o.deliveryAddress) : undefined);

  // Customer name may not be in the response
  const customerRaw = o.customer as Record<string, unknown> | null | undefined;
  const customerName = customerRaw
    ? [customerRaw.firstName, customerRaw.lastName].filter(Boolean).join(" ") || undefined
    : (o.customerName != null && typeof o.customerName === "string" ? o.customerName : undefined);

  return {
    id: String(o.orderId ?? o.id ?? orderId),
    status: String(o.orderStatus ?? o.status ?? "Pending") as OrderStatus,
    total,
    totalAmount: total,
    createdAt: o.createdAt != null ? String(o.createdAt) : undefined,
    orderItemsCount: items.length || (o.orderItemsCount != null ? Number(o.orderItemsCount) : undefined),
    customerName,
    customerPhone: o.customerPhone != null ? String(o.customerPhone) : (o.phoneNumber != null ? String(o.phoneNumber) : undefined),
    deliveryAddress,
    paymentMethod: o.paymentMethod != null ? String(o.paymentMethod) : undefined,
    notes: o.notes != null ? String(o.notes) : undefined,
    items,
  };
}

export async function getBranchOrders(branchId: string): Promise<Order[]> {
  if (USE_MOCK) return MOCK_ORDERS;
  const res = await api.get<unknown>(
    `/v1/branches/${branchId}/orders?page=1&pagesize=20`,
    { withRestaurantId: true }
  );
  const root = res as { items?: unknown[]; data?: unknown[] } | null;
  const list = Array.isArray(res) ? res : (root?.items ?? root?.data ?? []);
  return (list as Array<Record<string, unknown>>).map((o) => {
    const total = Number(o.totalPrice ?? o.totalAmount ?? o.total ?? 0);
    return {
      ...o,
      id: String(o.orderId ?? o.id ?? o.Id ?? ""),
      status: String(o.orderStatus ?? o.status ?? "Pending") as OrderStatus,
      total,
      totalAmount: total,
      createdAt: o.createdAt != null ? String(o.createdAt) : undefined,
      orderItemsCount: o.orderItemsCount != null ? Number(o.orderItemsCount) : undefined,
      customerName: o.customerName != null ? String(o.customerName) : undefined,
    };
  });
}
