export type Role = 'ADMIN' | 'SALESPERSON';
export interface User { id:string; name:string; username:string; phone?:string; role:Role; active?:boolean; storesVisited?:number; totalVisits?:number; todayVisits?:number }
export type PaymentStatus='PAID'|'PARTIAL'|'UNPAID';
export interface Payment { id:string; amount:number; createdAt:string; note?:string }
export interface Order { id:string; invoiceNumber?:string; billingType?:'ONLINE'|'PHYSICAL'; product:string; quantity:number; unitPrice:number; totalAmount:number; paidAmount:number; baki:number; paymentMethod?:string; date:string; notes?:string; payments?:Payment[] }
export interface Shop { id:string; name:string; ownerName:string; contactNumber:string; location:string; salesperson?:User; orders?:Order[]; totalAmount:number; paidAmount:number; baki:number; status:PaymentStatus; createdAt:string }
export interface Summary { totalShops:number; totalOrders?:number; totalSales:number; totalCollected:number; totalBaki:number; todayVisits?:number; todaySales?:number; todayCollected?:number; todayBaki?:number; recentEntries?:Shop[] }
export interface Dashboard extends Summary { sevenDaySales?:{date:string;amount:number}[]; topSalespersons?:Array<User & Summary>; topBakiShops?:Shop[] }
export interface Page<T>{ data:T[]; page:number; totalPages:number; total:number; nextPage?:number }
export type PaymentMethod = 'CASH' | 'UPI' | 'CHEQUE' | 'BANK_TRANSFER';
export interface ShopInput { name:string; location:string; ownerName:string; contactNumber:string; product:string; quantity:number; unitPrice:number; amountPaid:number; date:string; notes?:string; paymentMethod?:PaymentMethod; billingType?:'ONLINE'|'PHYSICAL' }