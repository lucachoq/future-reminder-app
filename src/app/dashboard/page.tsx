"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Settings, User, Calendar, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Reminder } from "@/lib/supabase";
import { formatDate, getRelativeTime, getCategoryEmoji } from "@/lib/utils";
import ReminderForm from "@/components/ReminderForm";
import ReminderCard from "@/components/ReminderCard";
import SettingsModal from "@/components/SettingsModal";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'incomplete' | 'completed' | 'all' | 'trash'>('incomplete');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [defaultPhone, setDefaultPhone] = useState<string>("");

  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (user) {
      loadReminders();
      loadDefaultPhone();
      // Set up interval to refresh reminders every 10 seconds
      const interval = setInterval(() => {
        loadReminders();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reminders')
        .select('*')
        .eq('user_id', user?.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      // Permanently delete reminders trashed > 30 days ago
      const now = new Date();
      for (const r of data || []) {
        if (r.deleted_at && new Date(r.deleted_at) < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
          await supabase.from('user_reminders').delete().eq('id', r.id);
        }
      }
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultPhone = async () => {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('phone')
        .eq('user_id', user?.id)
        .single();
      if (!error && data && data.phone) {
        setDefaultPhone(data.phone);
      }
    } catch (error) {
      // Ignore error, just don't set default phone
    }
  };

  const handleReminderSave = async (reminderData: Partial<Reminder>) => {
    try {
      if (editingReminder) {
        // Update existing reminder
        const { error } = await supabase
          .from('user_reminders')
          .update({
            ...reminderData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReminder.id);

        if (error) throw error;
      } else {
        // Create new reminder
        const { error } = await supabase
          .from('user_reminders')
          .insert([{
            ...reminderData,
            user_id: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
        // If SMS is selected, send SMS
        if (reminderData.contact_methods?.includes('sms') && reminderData.contact_phone && reminderData.message) {
          const smsBody = `You created a new reminder with the title: ${reminderData.title || 'No Title'}\nSet to be delivered: ${reminderData.reminder_date ? new Date(reminderData.reminder_date).toLocaleString() : 'No date set'}`;
          fetch('/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: reminderData.contact_phone,
              body: smsBody
            })
          });
        }
      }

      await loadReminders();
      setShowForm(false);
      setEditingReminder(null);
    } catch (error) {
      console.error('Error saving reminder:', error);
      alert('Failed to save reminder. Please try again.');
    }
  };

  const handleReminderDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_reminders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Failed to delete reminder. Please try again.');
    }
  };

  const handleReminderRestore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_reminders')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      await loadReminders();
    } catch (error) {
      console.error('Error restoring reminder:', error);
      alert('Failed to restore reminder. Please try again.');
    }
  };

  const handleReminderToggle = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('user_reminders')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      alert('Failed to update reminder. Please try again.');
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const filteredReminders = reminders.filter(reminder => {
    const now = new Date();
    const reminderDate = new Date(reminder.reminder_date);
    
    if (activeTab === 'trash') return !!reminder.deleted_at;
    if (reminder.deleted_at) return false;
    
    switch (activeTab) {
      case 'incomplete':
        return !reminder.completed;
      case 'completed':
        return reminder.completed;
      case 'all':
        return true;
      default:
        return true;
    }
  });

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Remind Me</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user.firstName || user.emailAddresses[0]?.emailAddress}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Incomplete</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reminders.filter(r => !r.completed && !r.deleted_at).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reminders.filter(r => r.completed && !r.deleted_at).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reminders.filter(r => !r.completed && !r.deleted_at && new Date(r.reminder_date) < new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add Reminder Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'incomplete', label: 'Incomplete', icon: Clock },
                { id: 'completed', label: 'Completed', icon: CheckCircle },
                { id: 'all', label: 'All', icon: Calendar },
                { id: 'trash', label: 'Trash', icon: Trash2 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Reminders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'incomplete' 
                ? 'Get started by creating your first reminder.'
                : activeTab === 'completed'
                ? 'No completed reminders yet.'
                : activeTab === 'trash'
                ? 'No trashed reminders yet.'
                : 'No reminders created yet.'
              }
            </p>
            {activeTab === 'incomplete' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4"
          >
            {filteredReminders.map((reminder, index) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={handleEditReminder}
                onDelete={handleReminderDelete}
                onToggle={handleReminderToggle}
                index={index}
                onRestore={activeTab === 'trash' ? handleReminderRestore : undefined}
                highlightOverdue={activeTab === 'incomplete'}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Modals */}
      {showForm && (
        <ReminderForm
          reminder={editingReminder}
          onSave={handleReminderSave}
          onCancel={() => {
            setShowForm(false);
            setEditingReminder(null);
          }}
          defaultPhone={defaultPhone}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
} 