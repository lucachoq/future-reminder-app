"use client";

import { motion } from "framer-motion";
import { Edit, Trash2, CheckCircle, Clock, AlertCircle, Mail, Phone, Bell, Calendar, Repeat, Zap } from "lucide-react";
import { Reminder } from "@/lib/supabase";
import { formatDate, getRelativeTime, getCategoryEmoji } from "@/lib/utils";
import { useState } from "react";

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  index: number;
  onRestore?: (id: string) => void;
  onDeletePermanent?: (id: string) => void;
  highlightOverdue?: boolean;
}

export default function ReminderCard({ 
  reminder, 
  onEdit, 
  onDelete, 
  onToggle, 
  index,
  onRestore,
  onDeletePermanent,
  highlightOverdue
}: ReminderCardProps) {
  const isOverdue = !reminder.completed && new Date(reminder.reminder_date) < new Date();
  const isToday = new Date(reminder.reminder_date).toDateString() === new Date().toDateString();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dontRemind, setDontRemind] = useState(false);

  const getStatusIcon = () => {
    if (reminder.completed) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (isOverdue) return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (isToday) return <Clock className="h-5 w-5 text-orange-600" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  const getStatusText = () => {
    if (reminder.completed) return "Completed";
    if (isOverdue) return "Overdue";
    if (isToday) return "Today";
    return getRelativeTime(reminder.reminder_date);
  };

  const getStatusColor = () => {
    if (reminder.completed) return "bg-green-50 border-green-200";
    if (isOverdue) return "bg-red-50 border-red-200";
    if (isToday) return "bg-orange-50 border-orange-200";
    return "bg-blue-50 border-blue-200";
  };

  const getContactMethodIcons = () => {
    return reminder.contact_methods.map(method => {
      switch (method) {
        case 'email':
          return <Mail key={method} className="h-4 w-4 text-gray-500" />;
        case 'sms':
        case 'call':
          return <Phone key={method} className="h-4 w-4 text-gray-500" />;
        default:
          return null;
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all duration-200 hover:shadow-md ${getStatusColor()} ${highlightOverdue && isOverdue ? 'border-red-500 bg-red-50' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className={`text-sm font-medium ${
                reminder.completed ? 'text-green-700' :
                isOverdue ? 'text-red-700' :
                isToday ? 'text-orange-700' : 'text-blue-700'
              }`}>
                {getStatusText()}
              </span>
              {highlightOverdue && isOverdue && (
                <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold">Overdue</span>
              )}
            </div>
            
            {reminder.category && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
                <span>{getCategoryEmoji(reminder.category)}</span>
                <span className="text-xs text-gray-600 capitalize">{reminder.category}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${
            reminder.completed ? 'line-through text-gray-500' : ''
          }`}>
            {reminder.title}
          </h3>

          {/* Message */}
          {reminder.message && (
            <p className={`text-gray-600 mb-4 ${
              reminder.completed ? 'line-through text-gray-400' : ''
            }`}>
              {reminder.message}
            </p>
          )}

          {/* Details */}
          <div className="space-y-2">
            {/* Date */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(reminder.reminder_date)}</span>
            </div>

            {/* Contact Methods */}
            {reminder.contact_methods.length > 0 && (
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-gray-400" />
                <div className="flex items-center space-x-1">
                  {getContactMethodIcons()}
                </div>
                <span className="text-sm text-gray-500">
                  {reminder.contact_methods.join(', ')}
                </span>
              </div>
            )}

            {/* Persistence */}
            {reminder.persistence && reminder.persistence !== 'once' && (
              <div className="flex items-center space-x-2">
                <Repeat className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 capitalize">
                  {reminder.persistence} reminders
                </span>
              </div>
            )}

            {/* Repeat Settings */}
            {reminder.repeat_settings && (
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Repeats {reminder.repeat_settings.frequency}
                  {reminder.repeat_settings.until_complete && ' until completed'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {onRestore ? (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onRestore(reminder.id)}
              className="flex-1 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Restore
            </button>
            <button
              onClick={() => onDeletePermanent && onDeletePermanent(reminder.id)}
              className="flex-1 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete Permanently
            </button>
          </div>
        ) : (
        <div className="flex items-center space-x-2 ml-4">
          {/* Toggle Complete */}
          <button
            onClick={() => onToggle(reminder.id, !reminder.completed)}
            className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${
              reminder.completed
                ? 'text-green-600 hover:bg-green-100'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={reminder.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <CheckCircle className={`h-5 w-5 transition-transform duration-200 ${reminder.completed ? 'rotate-12 scale-110' : ''}`} />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(reminder)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Edit reminder"
          >
            <Edit className="h-5 w-5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
                if (localStorage.getItem('skipDeleteConfirm') === 'true') {
                onDelete(reminder.id);
                } else {
                  setShowDeleteModal(true);
              }
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
            title="Delete reminder"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
        )}
      </div>

      {/* Contact Details (if different from default) */}
      {(reminder.contact_email || reminder.contact_phone) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Details</h4>
          <div className="space-y-1">
            {reminder.contact_email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{reminder.contact_email}</span>
              </div>
            )}
            {reminder.contact_phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{reminder.contact_phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xs flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Delete Reminder?</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Do you really want to delete this reminder?</p>
            <label className="flex items-center mb-4">
              <input type="checkbox" checked={dontRemind} onChange={e => setDontRemind(e.target.checked)} className="mr-2" />
              <span className="text-xs text-gray-500">Don&apos;t show this again</span>
            </label>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  if (dontRemind) localStorage.setItem('skipDeleteConfirm', 'true');
                  onDelete(reminder.id);
                }}
                className="flex-1 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 