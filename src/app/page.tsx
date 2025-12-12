'use client';

import { useState } from 'react';
import { Plus, Search, Users, Zap } from 'lucide-react';
import AddContact from '@/components/AddContact';
import FindContact from '@/components/FindContact';

type Tab = 'add' | 'find';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('add');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm shadow-green-500/20">
                <Zap className="text-white" size={18} />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-green-600">who</span>
                  <span className="text-gray-400">tocall</span>
                </span>
              </div>
            </div>

            {/* Stats badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
              <Users size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Your Network</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="glass border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'add'
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Plus size={16} />
              Add Contact
            </button>
            <button
              onClick={() => setActiveTab('find')}
              className={`flex-1 h-11 flex items-center justify-center gap-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'find'
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Search size={16} />
              Find Contact
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="animate-in">
          {activeTab === 'add' ? <AddContact /> : <FindContact />}
        </div>
      </main>

      {/* Footer hint */}
      <footer className="fixed bottom-0 left-0 right-0 pb-4 pt-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none">
        <p className="text-center text-xs text-gray-400">
          Powered by AI for smarter networking
        </p>
      </footer>
    </div>
  );
}
