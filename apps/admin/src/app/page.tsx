'use client';

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold">AlphaQuest</span>
            <span className="text-gray-400 ml-2">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">admin@alphaquest.io</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-gray-400">Monitor and manage the AlphaQuest platform</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-card rounded-xl border border-border">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold mt-2">12,345</p>
          </div>
          <div className="p-6 bg-card rounded-xl border border-border">
            <p className="text-gray-400 text-sm">Active Projects</p>
            <p className="text-3xl font-bold mt-2">89</p>
          </div>
          <div className="p-6 bg-card rounded-xl border border-border">
            <p className="text-gray-400 text-sm">Total Campaigns</p>
            <p className="text-3xl font-bold mt-2">234</p>
          </div>
          <div className="p-6 bg-card rounded-xl border border-border">
            <p className="text-gray-400 text-sm">Tasks Completed</p>
            <p className="text-3xl font-bold mt-2">1.2M</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold mb-4">Pending Reviews</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm">Project: NewDeFi</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded">Approve</button>
                  <button className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded">Reject</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm">Campaign: Token Launch</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded">Approve</button>
                  <button className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded">Reject</button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold mb-4">High Risk Users</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm font-mono">0x1234...5678</span>
                <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded">Score: 85</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm font-mono">0xabcd...efgh</span>
                <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded">Score: 65</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
