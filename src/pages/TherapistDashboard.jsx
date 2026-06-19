import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, MessageCircle, ClipboardCheck, Settings, Brain } from 'lucide-react';
import TherapistChat from '../components/therapist/TherapistChat';
import TherapistFeedback from '../components/therapist/TherapistFeedback';
import TherapistSettings from '../components/therapist/TherapistSettings';
import ConfirmModal from '../components/ui/ConfirmModal';

const tabs = [
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'feedback', label: 'Daily Feedback', icon: ClipboardCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function TherapistDashboard({ user, authUserId, onLogout }) {
  const [activeTab, setActiveTab] = useState('messages');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const titles = {
    patients: 'My Patients',
    messages: 'Secure Messaging',
    feedback: 'Submit Daily Feedback',
    settings: 'Profile Settings',
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 glass-dark border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-lg shadow-teal-500/10 border border-white/10">
              <img src="/logo.png" alt="MindWell Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold gradient-text">MindWell</span>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'T'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.specialization || 'General Mental Health'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-teal-400 border border-teal-500/30 shadow-lg shadow-teal-500/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} className={activeTab === id ? 'text-teal-400' : 'text-slate-500'} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>

        <ConfirmModal 
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={onLogout}
          title="Sign out of Portal?"
          message="You are securely ending your current session."
          confirmText="Sign Out"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-white mb-2">{titles[activeTab]}</h1>
          <p className="text-slate-400 mb-8">
            {activeTab === 'messages' && 'Encrypted real-time messaging with your patients.'}
            {activeTab === 'feedback' && 'Submit a structured daily evaluation for any patient.'}
            {activeTab === 'settings' && 'Manage your profile and availability.'}
          </p>

          {activeTab === 'messages' && <TherapistChat authUserId={authUserId} />}
          {activeTab === 'feedback' && <TherapistFeedback authUserId={authUserId} />}
          {activeTab === 'settings' && <TherapistSettings user={user} />}
        </motion.div>
      </div>
    </div>
  );
}
