import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package
} from 'lucide-react';

export default async function AdminDashboardPage() {
  // In a real app, fetch these stats here
  // const stats = await fetchAdminStats();

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">Overview of your store&apos;s performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value="$45,231.89" 
          trend="+20.1%" 
          trendUp={true}
          icon={DollarSign}
        />
        <StatCard 
          title="Orders" 
          value="+2350" 
          trend="+180.1%" 
          trendUp={true}
          icon={ShoppingBag}
        />
        <StatCard 
          title="Products" 
          value="12,234" 
          trend="+19%" 
          trendUp={true}
          icon={Package}
        />
        <StatCard 
          title="Active Now" 
          value="+573" 
          trend="-201 since last hour" 
          trendUp={false}
          icon={Users}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Recent Orders</h3>
            <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900">View All</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                    <ShoppingBag className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Order #320{i}</div>
                    <div className="text-xs text-zinc-500">2 minutes ago</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-zinc-900">$120.00</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Low Stock Alert</h3>
            <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Manage Inventory</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-zinc-100" /> {/* Product Thumb Placeholder */}
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Black T-Shirt XL</div>
                    <div className="text-xs text-red-500">Only 2 left</div>
                  </div>
                </div>
                <button className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-50">
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  trend, 
  trendUp, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  trend: string; 
  trendUp: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">{title}</span>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="mt-2 text-2xl font-bold text-zinc-900">{value}</div>
      <div className="mt-1 flex items-center text-xs">
        {trendUp ? (
          <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
        ) : (
          <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
        )}
        <span className={trendUp ? "text-emerald-600" : "text-red-600"}>
          {trend}
        </span>
        <span className="ml-1 text-zinc-400">from last month</span>
      </div>
    </div>
  );
}