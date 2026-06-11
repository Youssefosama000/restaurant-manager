import { api } from "./client";

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
  await api.patch(`/v1/orders/${orderId}/status`, { Status: status });
}

export async function getOrdersTrend(branchId: string, period: TrendPeriod): Promise<TrendSummary> {
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
export async function getBranchOrders(branchId: string): Promise<Order[]> {
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
