"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Bell, User, Shield, CreditCard } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { UserSettings } from "@/lib/supabase";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    default_reminder_time: "09:00"
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setSettings(data);
        setFormData({
          email: data.email,
          phone: data.phone || "",
          default_reminder_time: data.default_reminder_time
        });
      } else {
        // Create default settings
        setFormData({
          email: user?.emailAddresses[0]?.emailAddress || "",
          phone: "",
          default_reminder_time: "09:00"
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  function formatPhoneNumber(phone: string) {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length < 4) return cleaned;
    if (cleaned.length < 7) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6,10)}`;
  }
  function toE164(phone: string) {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return '+1' + cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('1')) return '+' + cleaned;
    return cleaned;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsData = {
        user_id: user?.id,
        email: formData.email,
        phone: formData.phone ? toE164(formData.phone) : null,
        default_reminder_time: formData.default_reminder_time,
        updated_at: new Date().toISOString()
      };

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_information')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('user_information')
          .insert([{
            ...settingsData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      await loadSettings();
      // Optionally, set a local state to show a temporary success message in the UI
      // setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              placeholder="email@example.com"
            />
            <p className="mt-1 text-sm text-gray-500">
              This email will be used as the default for new reminders
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Phone Number
            </label>
            <input
              type="tel"
              value={formatPhoneNumber(formData.phone)}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setFormData(prev => ({ ...prev, phone: raw }));
              }}
              onBlur={e => {
                // On blur, format to E.164 for saving
                setFormData(prev => ({ ...prev, phone: toE164(prev.phone) }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              placeholder="(226) 975-9610"
            />
            <p className="mt-1 text-sm text-gray-500">
              This phone number will be used as the default for SMS and call reminders
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Reminder Time
            </label>
            <input
              type="time"
              value={formData.default_reminder_time}
              onChange={(e) => setFormData(prev => ({ ...prev, default_reminder_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Default time for new reminders when no specific time is set
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      label: 'Privacy & Security',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">Your Data is Secure</h3>
            <p className="text-sm text-green-700">
              We use industry-standard encryption to protect your personal information and reminder data. All your reminders and personal information are stored securely in our database with encryption at rest.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Data Usage</h4>
              <p className="text-sm text-gray-600">
                We only use your contact information to send you the reminders you've requested. We never share your data with third parties.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Account Deletion</h4>
              <p className="text-sm text-gray-600">
                You can delete your account at any time, which will permanently remove all your data from our systems.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      content: (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Free Plan</h3>
            <p className="text-sm text-yellow-700">
              You're currently on the free plan. Upgrade to unlock unlimited reminders and advanced features.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Current Plan</h4>
              <p className="text-sm text-gray-600">Free Plan - 2 reminders per month</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Usage</h4>
              <p className="text-sm text-gray-600">0 of 2 reminders used this month</p>
            </div>

            <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Upgrade Plan
            </button>
          </div>
        </div>
      )
    }
  ];

  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-center text-gray-600">Loading settings...</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 bg-gray-50">
              <nav className="p-4 space-y-1">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {settingsTabs.find(tab => tab.id === activeTab)?.content}
              </div>
            </div>
          </div>

          {/* Footer */}
          {activeTab === 'profile' && (
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 