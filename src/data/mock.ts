import earbuds from "@/assets/p-earbuds.jpg";
import kurta from "@/assets/p-kurta.jpg";
import watch from "@/assets/p-watch.jpg";

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice?: number | undefined;
  stock: number;
  active: boolean;
  vendor: string;
  city: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  startingPrice: number;
  city: string;
  provider: string;
  rating: number;
  duration: string;
  description: string;
  includes: string[];
};

export const categories = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty",
  "Mobile Accessories",
  "Kids",
];

const images = [earbuds, kurta, watch];

const seed: Array<Partial<Product> & { name: string; category: string; price: number }> = [
  { name: "TWS Bluetooth Earbuds Pro", category: "Electronics", price: 3499, oldPrice: 4999, stock: 42 },
  { name: "Embroidered Lawn Kurta", category: "Fashion", price: 2850, oldPrice: 3600, stock: 18 },
  { name: "Classic Analog Wrist Watch", category: "Fashion", price: 4200, stock: 7 },
  { name: "Fast Charging Cable Type-C", category: "Mobile Accessories", price: 650, oldPrice: 900, stock: 120 },
  { name: "Non-Stick Cookware Set", category: "Home & Living", price: 7999, stock: 0, active: false },
  { name: "Matte Lipstick Combo", category: "Beauty", price: 1250, oldPrice: 1600, stock: 64 },
  { name: "Kids Cotton 2-Piece Suit", category: "Kids", price: 1899, stock: 25 },
  { name: "Smart Fitness Band", category: "Electronics", price: 5299, oldPrice: 6500, stock: 12 },
  { name: "Cotton Bedsheet King Size", category: "Home & Living", price: 4499, stock: 33 },
  { name: "Power Bank 20000mAh", category: "Mobile Accessories", price: 3999, stock: 9 },
  { name: "Herbal Face Wash", category: "Beauty", price: 749, stock: 88 },
  { name: "Men's Casual Sneakers", category: "Fashion", price: 5499, oldPrice: 6900, stock: 21 },
];

const vendors = ["Al-Madina Traders", "Karachi Mart", "Lahore Bazaar", "Peshawar Store"];
const cities = ["Karachi", "Lahore", "Islamabad", "Faisalabad"];

export const products: Product[] = seed.map((p, i): Product => ({
  id: `PRD-${1000 + i}`,
  slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name: p.name,
  category: p.category,
  price: p.price,
  oldPrice: p.oldPrice,
  stock: p.stock ?? 10,
  active: p.active ?? true,
  vendor: vendors[i % vendors.length]!,
  city: cities[i % cities.length]!,
  rating: 4 + ((i % 10) / 10),
  reviews: 12 + i * 7,
  image: images[i % images.length]!,
  description:
    "Original quality product with 7-day return policy. Cash on Delivery available all over Pakistan. Fast dispatch within 24 hours from verified Dukaan.pk sellers.",
}));

export const services: Service[] = [
  {
    id: "SRV-201",
    name: "AC Installation & Service",
    category: "Home Services",
    startingPrice: 2500,
    city: "Karachi",
    provider: "CoolCare Technicians",
    rating: 4.8,
    duration: "1-2 hours",
    description: "Professional AC installation, gas refilling and deep cleaning by trained technicians.",
    includes: ["Free inspection", "Gas pressure check", "Deep coil cleaning", "30-day service warranty"],
  },
  {
    id: "SRV-202",
    name: "Home Deep Cleaning",
    category: "Home Services",
    startingPrice: 6000,
    city: "Lahore",
    provider: "SparkClean Pk",
    rating: 4.6,
    duration: "4-6 hours",
    description: "Complete house deep cleaning including kitchen, washrooms and floors.",
    includes: ["Kitchen degreasing", "Washroom sanitizing", "Floor polishing", "Eco-friendly chemicals"],
  },
  {
    id: "SRV-203",
    name: "Mobile Screen Repair",
    category: "Repair",
    startingPrice: 3500,
    city: "Islamabad",
    provider: "FixIt Mobiles",
    rating: 4.7,
    duration: "45 minutes",
    description: "Original panel replacement for all major smartphone brands with warranty.",
    includes: ["Free diagnostics", "Original panel", "3-month warranty", "Doorstep pickup"],
  },
  {
    id: "SRV-204",
    name: "Bridal Makeup at Home",
    category: "Beauty",
    startingPrice: 15000,
    city: "Faisalabad",
    provider: "Glow Studio",
    rating: 4.9,
    duration: "3 hours",
    description: "Professional bridal makeup, hairstyling and draping at your home.",
    includes: ["HD makeup", "Hair styling", "Dupatta setting", "Trial session"],
  },
  {
    id: "SRV-205",
    name: "Electrician On Demand",
    category: "Home Services",
    startingPrice: 1200,
    city: "Karachi",
    provider: "SafeWire Services",
    rating: 4.5,
    duration: "1 hour",
    description: "Wiring, switchboard and fan installation by verified electricians.",
    includes: ["Visit charges included", "Verified staff", "Material at cost", "Same-day slot"],
  },
  {
    id: "SRV-206",
    name: "Car Wash at Doorstep",
    category: "Auto",
    startingPrice: 1800,
    city: "Lahore",
    provider: "AutoShine",
    rating: 4.4,
    duration: "90 minutes",
    description: "Waterless eco car wash with interior vacuum and dashboard polish.",
    includes: ["Exterior foam wash", "Interior vacuum", "Tyre polish", "Dashboard shine"],
  },
];

export type OrderStatus = "Pending" | "Confirmed" | "Dispatched" | "Delivered" | "Cancelled";

export type Order = {
  id: string;
  customer: string;
  phone: string;
  city: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
  vendor: string;
};

export const orders: Order[] = [
  { id: "DKN-90231", customer: "Ahmed Raza", phone: "0300-1234567", city: "Karachi", items: 2, total: 6349, status: "Pending", date: "2026-08-06", vendor: "Al-Madina Traders" },
  { id: "DKN-90230", customer: "Sana Malik", phone: "0321-9876543", city: "Lahore", items: 1, total: 2850, status: "Confirmed", date: "2026-08-06", vendor: "Lahore Bazaar" },
  { id: "DKN-90229", customer: "Bilal Khan", phone: "0333-4567890", city: "Islamabad", items: 3, total: 10450, status: "Dispatched", date: "2026-08-05", vendor: "Karachi Mart" },
  { id: "DKN-90228", customer: "Hira Fatima", phone: "0345-1122334", city: "Faisalabad", items: 1, total: 1250, status: "Delivered", date: "2026-08-04", vendor: "Peshawar Store" },
  { id: "DKN-90227", customer: "Usman Tariq", phone: "0301-5566778", city: "Karachi", items: 2, total: 8998, status: "Delivered", date: "2026-08-03", vendor: "Al-Madina Traders" },
  { id: "DKN-90226", customer: "Ayesha Noor", phone: "0311-2233445", city: "Multan", items: 1, total: 3999, status: "Cancelled", date: "2026-08-02", vendor: "Karachi Mart" },
];

export const vendorStats = {
  revenue: 486300,
  orders: 312,
  products: 48,
  pendingPayout: 74200,
};

export const salesChart = [
  { month: "Mar", sales: 42000 },
  { month: "Apr", sales: 58000 },
  { month: "May", sales: 51000 },
  { month: "Jun", sales: 73000 },
  { month: "Jul", sales: 89000 },
  { month: "Aug", sales: 96000 },
];

export const commissions = [
  { id: "CMS-501", order: "DKN-90231", partner: "Zeeshan Ali", amount: 634, rate: "10%", status: "Pending" },
  { id: "CMS-502", order: "DKN-90229", partner: "Nadia Iqbal", amount: 1045, rate: "10%", status: "Approved" },
  { id: "CMS-503", order: "DKN-90228", partner: "Zeeshan Ali", amount: 125, rate: "10%", status: "Paid" },
  { id: "CMS-504", order: "DKN-90227", partner: "Hamza Sheikh", amount: 899, rate: "10%", status: "Approved" },
];

export const payouts = [
  { id: "PYT-301", to: "Al-Madina Traders", type: "Vendor", amount: 74200, method: "Bank Transfer", status: "Pending", date: "2026-08-07" },
  { id: "PYT-300", to: "Zeeshan Ali", type: "Partner", amount: 12400, method: "JazzCash", status: "Paid", date: "2026-08-01" },
  { id: "PYT-299", to: "Lahore Bazaar", type: "Vendor", amount: 53800, method: "Bank Transfer", status: "Paid", date: "2026-07-28" },
  { id: "PYT-298", to: "Nadia Iqbal", type: "Partner", amount: 8600, method: "EasyPaisa", status: "Processing", date: "2026-07-25" },
];

export const vendorsList = [
  { id: "VND-11", name: "Al-Madina Traders", owner: "Kamran Sheikh", city: "Karachi", products: 48, orders: 312, status: "Active", joined: "2025-11-02" },
  { id: "VND-12", name: "Lahore Bazaar", owner: "Faisal Butt", city: "Lahore", products: 31, orders: 187, status: "Active", joined: "2026-01-14" },
  { id: "VND-13", name: "Karachi Mart", owner: "Sadia Anwar", city: "Karachi", products: 66, orders: 402, status: "Pending", joined: "2026-04-08" },
  { id: "VND-14", name: "Peshawar Store", owner: "Rehan Gul", city: "Peshawar", products: 12, orders: 44, status: "Suspended", joined: "2026-05-19" },
];

export const partnersList = [
  { id: "PTR-21", name: "Zeeshan Ali", phone: "0300-7654321", city: "Karachi", products: 14, vendor: "Al-Madina Traders", status: "Active" },
  { id: "PTR-22", name: "Nadia Iqbal", phone: "0312-8899001", city: "Lahore", products: 9, vendor: "Lahore Bazaar", status: "Active" },
  { id: "PTR-23", name: "Hamza Sheikh", phone: "0345-6677889", city: "Islamabad", products: 5, vendor: "Karachi Mart", status: "Inactive" },
];

export const formatPKR = (n: number) =>
  `Rs. ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export const trackingSteps = [
  { label: "Order Placed", time: "06 Aug, 10:12 AM", done: true },
  { label: "Confirmed by Vendor", time: "06 Aug, 11:40 AM", done: true },
  { label: "Dispatched", time: "07 Aug, 09:05 AM", done: true },
  { label: "Out for Delivery", time: "Expected 08 Aug", done: false },
  { label: "Delivered", time: "—", done: false },
];