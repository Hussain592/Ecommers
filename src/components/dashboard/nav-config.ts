import {
  BadgePercent,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackagePlus,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";

import type { NavItem } from "./DashboardShell";

export const vendorNav: NavItem[] = [
  {
    to: "/vendor",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/vendor/products",
    label: "Products",
    icon: Package,
  },
  {
    to: "/vendor/products/new",
    label: "Add Product",
    icon: PackagePlus,
  },
  {
    to: "/vendor/orders",
    label: "Orders",
    icon: ShoppingBag,
  },
  {
    to: "/vendor/earnings",
    label: "Earnings",
    icon: Wallet,
  },
  {
    to: "/vendor/settings",
    label: "Settings",
    icon: Settings,
  },
];

export const partnerNav: NavItem[] = [
  {
    to: "/partner",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/partner/add-product",
    label: "Add Product",
    icon: PackagePlus,
  },
  {
    to: "/partner/products",
    label: "Products",
    icon: Package,
  },
  {
    to: "/partner/stock",
    label: "Stock Update",
    icon: Boxes,
  },
  {
    to: "/partner/profile",
    label: "Profile",
    icon: UserCircle,
  },
];

export const adminNav: NavItem[] = [
  {
    to: "/admin/overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/vendors",
    label: "Vendors",
    icon: Store,
  },
  {
    to: "/admin/products",
    label: "Product Review",
    icon: Package,
  },
  {
    to: "/admin/orders",
    label: "Orders",
    icon: ClipboardList,
  },
  {
    to: "/admin/commissions",
    label: "Commissions",
    icon: BadgePercent,
  },
  {
    to: "/admin/payouts",
    label: "Payouts",
    icon: Wallet,
  },
  {
    to: "/admin/categories",
    label: "Categories",
    icon: Tags,
  },
  {
    to: "/admin/users",
    label: "Partners / Users",
    icon: Users,
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
];