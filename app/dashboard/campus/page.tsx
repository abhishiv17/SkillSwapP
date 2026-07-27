'use client';

import { useState } from 'react';
import { Flame, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpBoardTab } from '@/components/dashboard/campus/HelpBoardTab';
import { ForumTab } from '@/components/dashboard/campus/ForumTab';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import { Tabs } from '@/components/dashboard/ui/Tabs';
import { Button } from '@/components/dashboard/ui/Button';

export default function CampusPage() {
  const [activeTab, setActiveTab] = useState('forum');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpForm, setShowHelpForm] = useState(false);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-page-in">
      {/* Header */}
      <PageHeader 
        title="Campus Hub"
        subtitle="Connect with the community, ask for help, or join discussions."
      />

      {/* Unified Search & Action */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-neo-yellow border-[3px] border-neo-ink p-4 shadow-[4px_4px_0_#111111]">
        <Tabs 
          tabs={[
            { id: 'forum', label: 'Discussions' },
            { id: 'feed', label: 'Help Board' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-full lg:w-auto shadow-[2px_2px_0_#111111]"
        />

        <div className="relative w-full flex-1">
          <Search size={20} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
          <input
            type="text"
            placeholder={activeTab === 'forum' ? "SEARCH DISCUSSIONS..." : "SEARCH HELP REQUESTS..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-[44px] rounded-sm bg-white border-[2px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/50 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[2px_2px_0_var(--ss-purple)] transition-all uppercase tracking-widest"
          />
        </div>
        
        {activeTab === 'forum' ? (
          <Link href="/dashboard/forum/new" className="w-full lg:w-auto shrink-0">
            <Button variant="primary" size="md" icon={<Plus size={18} strokeWidth={3} />} className="w-full">
              New Discussion
            </Button>
          </Link>
        ) : (
          <Button 
            variant={showHelpForm ? "danger" : "primary"}
            size="md"
            icon={showHelpForm ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
            onClick={() => setShowHelpForm(!showHelpForm)}
            className="w-full lg:w-auto shrink-0"
          >
            {showHelpForm ? 'Cancel' : 'New Request'}
          </Button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'forum' ? (
          <ForumTab searchQuery={searchQuery} />
        ) : (
          <HelpBoardTab showForm={showHelpForm} setShowForm={setShowHelpForm} />
        )}
      </div>
    </div>
  );
}
