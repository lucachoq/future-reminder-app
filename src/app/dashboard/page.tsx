"use client";

import { useUser, UserButton } from "@clerk/nextjs";
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
  const [defaultEmail, setDefaultEmail] = useState<string>("");
  const [defaultContactMethods, setDefaultContactMethods] = useState<string[]>(["sms"]);

  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (user) {
      loadReminders();
      loadDefaultPhone();
      loadDefaultEmail();
      loadDefaultContactMethods();
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

  const loadDefaultEmail = async () => {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('email')
        .eq('user_id', user?.id)
        .single();
      if (!error && data && data.email) {
        setDefaultEmail(data.email);
      }
    } catch (error) {
      // Ignore error, just don't set default email
    }
  };

  const loadDefaultContactMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('user_information')
        .select('default_contact_methods')
        .eq('user_id', user?.id)
        .single();
      if (!error && data && data.default_contact_methods) {
        setDefaultContactMethods(data.default_contact_methods);
      }
    } catch (error) {
      // Ignore error, just don't set default contact methods
    }
  };

  const handleReminderSave = async (reminderData: Partial<Reminder>) => {
    try {
      if (editingReminder) {
        // Update existing reminder
        const { error } = await supabase
          .from('user_reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);
        
        if (error) throw error;
      } else {
        // Create new reminder
        const { error } = await supabase
          .from('user_reminders')
          .insert([{
            ...reminderData,
            user_id: user?.id,
          }]);
        
        if (error) throw error;
      }
      
      setShowForm(false);
      setEditingReminder(null);
      loadReminders();
    } catch (error: unknown) {
      console.error('Error saving reminder:', error);
    }
  };

  const handleReminderDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_reminders')
        .update({ completed: true, deleted_at: new Date().toISOString() })
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
        .update({ completed: false, deleted_at: null })
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

  const handleReminderDeletePermanent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_reminders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await loadReminders();
    } catch (error) {
      console.error('Error permanently deleting reminder:', error);
      alert('Failed to permanently delete reminder. Please try again.');
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
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pb-16">
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
            onClick={() => {
              setEditingReminder(null);
              setShowForm(true);
            }}
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
                  onClick={() => setActiveTab(tab.id as 'incomplete' | 'completed' | 'all' | 'trash')}
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
                onDeletePermanent={activeTab === 'trash' ? handleReminderDeletePermanent : undefined}
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
          defaultEmail={defaultEmail}
          defaultContactMethods={defaultContactMethods}
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