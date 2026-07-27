export type Role = "BUYER" | "SELLER" | "ADMIN";

export interface Address {
  city: string;
  region: string;
  street: string;
  houseNumber: string;
  ghanaPost: string;
}

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  imageUrl?: string | null;
  phone?: string | null;
  online?: boolean;
  verified?: boolean;
  registrationStep: number;
  address?: Address | null;
  accountStatus?: AccountStatus;
}

export interface Review {
  name: string;
  title: string;
  content: string;
  rating: number;
}

export interface Product {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  inStock: number;
  Brand?: string | null;
  ram?: string | null;
  displaySize?: number | null;
  eta?: number | null;
  rating?: number | null;
  popular: boolean;
  forWhom?: string | null;
  genre?: string | null;
  language?: string | null;
  type?: string | null;
  specs?: string[] | null;
  category: string | null;
  sellerId: string;
  imgs: string[];
  reviews: Review[];
  // Present on products imported from third-party marketplace datasets;
  // null/undefined for natively-listed products.
  currency?: string | null;
  originalPrice?: number | null;
  sku?: string | null;
  sourceUrl?: string | null;
  sourceMarketplace?: string | null;
  externalSellerName?: string | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  deliveryInfo?: string[] | null;
  categoryPath?: string[] | null;
}

export interface CategoryFilterGroup {
  filterName: string;
  filterList: string[];
}

export interface Category {
  _id: string;
  title: string;
  keywords?: string[];
  filters: Record<string, CategoryFilterGroup>;
}

export interface CartItem {
  quantity: number;
  product: Product;
}

export type Cart = Record<string, CartItem>;

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
export type PaymentStatus = "PENDING" | "PAID";

export interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  specifications?: string[] | null;
  images?: string[] | null;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  orderDate: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  payment: PaymentStatus;
  items: OrderItem[];
}

export interface ChatLastMessage {
  preview: string;
  createdAt: string;
  isMine: boolean;
}

export interface ChatContact {
  id: string;
  roomId: string;
  name: string;
  image?: string | null;
  online: boolean;
  lastSeen?: string | null;
  unreadCount: number;
  lastMessage?: ChatLastMessage | null;
}

export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "PRODUCT";

export interface ProductSnapshot {
  id: string;
  title: string;
  image: string | null;
  price: number;
  currency: string | null;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  message?: string | null;
  messageType: MessageType;
  attachmentUrls?: string[] | null;
  imageCaption?: string | null;
  productSnapshot?: ProductSnapshot | null;
  seenBy?: string[] | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
}
