"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Mail, Phone, Bell, Repeat, Zap, Plus, Minus, Smile } from "lucide-react";
import { Reminder } from "@/lib/supabase";
import { getCategoryEmoji } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { v4 as uuidv4 } from 'uuid';
import { supabase, UserTheme } from '@/lib/supabase';

interface ReminderFormProps {
  reminder?: Reminder | null;
  onSave: (reminderData: Partial<Reminder>) => void;
  onCancel: () => void;
}

export default function ReminderForm({ reminder, onSave, onCancel, defaultReminderTime, defaultEmail, defaultPhone }: ReminderFormProps & { defaultReminderTime?: string, defaultEmail?: string, defaultPhone?: string }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: reminder?.title || "",
    message: reminder?.message || "",
    reminder_date: reminder?.reminder_date ? new Date(reminder.reminder_date).toISOString().slice(0, 16) : "",
    category: reminder?.category || "",
    contact_methods: reminder?.contact_methods || ["email"],
    persistence: reminder?.persistence || "once",
    contact_email: reminder?.contact_email || "",
    contact_phone: reminder?.contact_phone || "",
    repeat_settings: reminder?.repeat_settings || undefined,
  });

  const [timeType, setTimeType] = useState<'specific' | 'relative'>(
    reminder ? 'specific' : 'relative'
  );
  const [relativeTime, setRelativeTime] = useState({
    value: 0,
    unit: 'days' as 'minutes' | 'hours' | 'days' | 'weeks' | 'months'
  });
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    'Details',
    'Time',
    'Category',
    'Contact',
    'Persistence'
  ];

  const categories = [
    'health', 'business', 'personal', 'finance', 'education', 
    'travel', 'home', 'work', 'family', 'hobby'
  ];

  const contactMethods = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: Phone },
    { id: 'call', label: 'Phone Call', icon: Phone }
  ];

  // Remove persistenceOptions for daily, weekly, and custom
  const persistenceOptions = [
    { id: 'once', label: 'Once', description: 'Send once and stop' }
  ];

  const [editCategoriesOpen, setEditCategoriesOpen] = useState(false);
  // Initialize initialCategories with hardcoded emoji array
  const initialEmojis = ['🏥', '💼', '👤', '💰', '📚', '✈️', '🏠', '💻', '👨‍👩‍👧‍👦', '🎮'];
  const initialCategories = categories.filter(c => !['hobby', 'family', 'travel'].includes(c)).map((name, i) => ({ id: uuidv4(), name, emoji: initialEmojis[i] || '' }));
  const [customCategories, setCustomCategories] = useState(initialCategories);

  // Default categories with emojis
  const defaultCategories = [
    { name: 'Work', emoji: '💻' },
    { name: 'Health', emoji: '🏥' },
    { name: 'Finance', emoji: '💰' },
    { name: 'Personal', emoji: '👤' },
    { name: 'Home', emoji: '🏠' }
  ];

  // 1. Emoji picker logic
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<number | null>(null);
  const emojiList = [
    "😀","😃","😄","😁","😆","😊","😎","😍","🥰","😇","🤓","🧑‍💻","👨‍💻","👩‍💻","💼","🏥","🏠","🏡","🏢","🏫","📚","💰","💸","💳","📅","📆","📈","📉","📊","📋","📦","📞","📧","📱","📝","🔔","⏰","🕒","📅","🎂","🎉","🎁","🛒","🚗","✈️","🚆","🚀","🧳","🛏️","🍎","🍔","🍕","🍣","🍰","☕","🍺","⚽","🏀","🏈","🎾","🏓","🏸","🏊","🚴","🎨","🎵","🎸","🎤","🎧","🎬","📷","🎮","🧩","🧸","👨‍👩‍👧‍👦","👶","👧","👦","👩","👨","🧑","👵","👴"
  ];

  // 1. When setting a custom date, default the time to defaultReminderTime
  useEffect(() => {
    if (timeType === 'specific' && !formData.reminder_date && defaultReminderTime) {
      const today = new Date();
      const [hours, minutes] = defaultReminderTime.split(":");
      today.setHours(Number(hours), Number(minutes), 0, 0);
      setFormData(prev => ({ ...prev, reminder_date: today.toISOString().slice(0, 16) }));
    }
  }, [timeType, defaultReminderTime]);

  // 2. When clicking outside the emoji picker, close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerOpen !== null) {
        const picker = document.getElementById("emoji-picker-modal");
        if (picker && !picker.contains(event.target as Node)) {
          setEmojiPickerOpen(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiPickerOpen]);

  // Always autofill the user's email as the default contact email for reminders
  useEffect(() => {
    if (!reminder) {
      const userEmail = defaultEmail || user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
      if (formData.contact_methods.includes('email') && !formData.contact_email && userEmail) {
        setFormData(prev => ({ ...prev, contact_email: userEmail }));
      }
      if ((formData.contact_methods.includes('sms') || formData.contact_methods.includes('call')) && !formData.contact_phone && defaultPhone) {
        setFormData(prev => ({ ...prev, contact_phone: formatPhoneNumber(defaultPhone) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.contact_methods, defaultEmail, defaultPhone, user]);

  // Load user themes from Supabase on mount, or use defaults if none
  useEffect(() => {
    async function fetchThemes() {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_themes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setCustomCategories(data);
      } else {
        // If no custom categories, use defaults
        setCustomCategories(defaultCategories.map(cat => ({ id: uuidv4(), user_id: user.id, ...cat, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
      }
    }
    fetchThemes();
  }, [user]);

  // 1. Add validation for essential fields before allowing save
  const isFormValid = () => {
    return (
      formData.title.trim().length > 0 &&
      ((timeType === 'specific' && !!formData.reminder_date) || (timeType === 'relative' && relativeTime.value > 0)) &&
      !!formData.category &&
      formData.contact_methods.length > 0 &&
      (formData.contact_methods.includes('email') ? !!formData.contact_email : true) &&
      ((formData.contact_methods.includes('sms') || formData.contact_methods.includes('call')) ? !!formData.contact_phone : true) &&
      !!formData.persistence
    );
  };

  function formatPhoneNumber(phone: string) {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return '+1' + cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('1')) return '+' + cleaned;
    return cleaned;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Please fill in all required fields.');
      return;
    }
    
    let finalDate = formData.reminder_date;
    if (timeType === 'relative') {
      const now = new Date();
      const multiplier = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000,
        months: 30 * 24 * 60 * 60 * 1000
      };
      const futureDate = new Date(now.getTime() + (relativeTime.value * multiplier[relativeTime.unit]));
      finalDate = futureDate.toISOString();
    }

    const reminderData: Partial<Reminder> = {
      title: formData.title,
      message: formData.message,
      reminder_date: finalDate,
      category: formData.category,
      contact_methods: formData.contact_methods,
      persistence: formData.persistence,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone ? formatPhoneNumber(formData.contact_phone) : '',
      repeat_settings: formData.repeat_settings || undefined,
    };

    onSave(reminderData);
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleContactMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      contact_methods: prev.contact_methods.includes(method)
        ? prev.contact_methods.filter(m => m !== method)
        : [...prev.contact_methods, method]
    }));
  };

  // Only call onSave in handleSubmit (form submit), not in nextStep or anywhere else
  const nextStep = () => {
    if (!canAdvance()) {
      setShowValidationMsg(true);
      setShakeNext(true);
      setTimeout(() => {
        setShakeNext(false);
        setShowValidationMsg(false);
      }, 600);
      return;
    }
    setShowValidationMsg(false);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Helper for high-contrast placeholder
  const placeholderClass = "placeholder-gray-700/80";

  // Replace placeholderClass with text-gray-800 for all inputs
  const inputClass = cn("w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800", placeholderClass);

  // Stepper with clickable numbers and improved look
  const stepperClass = cn(
    "flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl"
  );

  // For each step, prevent advancing if required fields are missing
  const canAdvance = () => {
    if (step === 0) return formData.title.trim().length > 0;
    if (step === 1) return timeType === 'specific' ? !!formData.reminder_date : relativeTime.value > 0;
    if (step === 2) return !!formData.category;
    if (step === 3) {
      let valid = formData.contact_methods.length > 0;
      if (formData.contact_methods.includes('email')) {
        valid = valid && !!formData.contact_email && validateEmail(formData.contact_email);
      }
      if (formData.contact_methods.includes('sms') || formData.contact_methods.includes('call')) {
        valid = valid && !!formData.contact_phone && validatePhone(formData.contact_phone);
      }
      return valid;
    }
    if (step === 4) return !!formData.persistence;
    return true;
  };

  const openEmojiPicker = (index: number) => {
    // This function would typically open a modal or state for an emoji picker
    // For now, we'll just update the emoji for the specific category
    setCustomCategories(prev => prev.map((category, i) => i === index ? { ...category, emoji: emojiList[Math.floor(Math.random() * emojiList.length)] } : category));
  };

  const [showValidationMsg, setShowValidationMsg] = useState(false);
  const [shakeNext, setShakeNext] = useState(false);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  function validateEmail(email: string) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function validatePhone(phone: string) {
    // Simple phone regex (accepts numbers, spaces, dashes, parentheses, +)
    return /^\+?[0-9\s\-()]{7,}$/.test(phone);
  }

  // Save user themes to Supabase when Done is clicked in Edit Categories modal
  async function saveThemesToSupabase() {
    if (!user) return;
    // Remove empty names
    const filtered = customCategories.filter(cat => cat.name.trim() !== '');
    // Upsert all
    await supabase.from('user_themes').upsert(
      filtered.map(cat => ({ ...cat, user_id: user.id }))
    );
    // Optionally, delete removed themes (not implemented here)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Stepper */}
          <div className={stepperClass}>
            <div className="flex items-center gap-2">
              {steps.map((label, idx) => (
            <button
                  key={label}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full font-bold border-2 transition-all duration-150",
                    idx === step ? "bg-blue-600 text-white border-blue-600 scale-110 shadow" : idx < step ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-white text-gray-400 border-gray-300 hover:bg-gray-100"
                  )}
                  aria-label={`Go to step ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Step 1: Details */}
            {step === 0 && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={inputClass}
                placeholder="What do you need to remember?"
              />
                <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                  className={inputClass}
                placeholder="Add details about your reminder..."
              />
            </div>
            )}
            {/* Step 2: Time */}
            {step === 1 && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When to remind you *</label>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setTimeType('specific')}
                      className={cn("flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors", timeType === 'specific' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:border-gray-400')}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Specific Date & Time</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeType('relative')}
                      className={cn("flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors", timeType === 'relative' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:border-gray-400')}
                  >
                    <Clock className="h-4 w-4" />
                    <span>In X time from now</span>
                  </button>
                </div>
                {timeType === 'specific' ? (
                  <input
                    type="datetime-local"
                    required
                    value={formData.reminder_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminder_date: e.target.value }))}
                      className={inputClass}
                  />
                ) : (
                  <div className="flex space-x-4 items-center">
                    <input
                      type="number"
                      min="1"
                        value={relativeTime.value === 0 || relativeTime.value === undefined ? '' : relativeTime.value}
                        onChange={(e) => setRelativeTime(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                        className={inputClass}
                        placeholder="e.g. 3"
                    />
                    <select
                      value={relativeTime.unit}
                      onChange={(e) => setRelativeTime(prev => ({ ...prev, unit: e.target.value as any }))}
                        className={inputClass}
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                    <span className="text-gray-600">from now</span>
                  </div>
                )}
              </div>
            </div>
            )}
            {/* Step 3: Category */}
            {step === 2 && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                  {customCategories.map((category, idx) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.name)}
                      className={cn("flex items-center space-x-2 justify-center p-3 rounded-md border transition-colors min-h-[64px] min-w-[160px] h-[64px] w-full", formData.category === category.name ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:border-gray-400')}
                      style={{ aspectRatio: '3/1' }}
                    >
                      <span>{category.emoji || <Smile className="w-5 h-5 text-gray-400" />}</span>
                      <span className="capitalize">{category.name}</span>
                    </button>
                  ))}
                  {/* Manage Categories button here */}
                  <button
                    type="button"
                    onClick={() => setEditCategoriesOpen(true)}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-blue-600 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm min-h-[64px] min-w-[160px] h-[64px] w-full"
                    style={{ aspectRatio: '3/1' }}
                  >
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-xs">Manage Categories</span>
                  </button>
                </div>
                {editCategoriesOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setEditCategoriesOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Categories</h3>
                      <ul className="space-y-2 mb-4">
                        {customCategories.map((cat, idx) => (
                          <li key={cat.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={cat.name}
                              onChange={e => setCustomCategories(prev => prev.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
                              className="border px-2 py-1 rounded text-gray-800 flex-1"
                              placeholder="Category name"
                            />
                            {/* Emoji button */}
                            <button
                              type="button"
                              onClick={() => setEmojiPickerOpen(idx)}
                              className="w-10 h-10 flex items-center justify-center border rounded bg-gray-100 hover:bg-gray-200"
                            >
                              {cat.emoji || <Smile className="w-5 h-5 text-gray-400" />}
                            </button>
                            {emojiPickerOpen === idx && (
                              <div id="emoji-picker-modal" className="absolute z-50 bg-white border rounded shadow pt-8 p-2 max-h-48 overflow-y-auto mt-2" style={{ minWidth: '320px' }}>
                                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 z-10" onClick={() => setEmojiPickerOpen(null)}>
                                  <X className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-8 gap-1">
                                  {emojiList.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      className="text-xl hover:bg-gray-100 rounded"
                                      onClick={() => {
                                        setCustomCategories(prev => prev.map((c, i) => i === idx ? { ...c, emoji } : c));
                                        setEmojiPickerOpen(null);
                                      }}
                                    >
                                      {emoji}
                  </button>
                ))}
              </div>
            </div>
                            )}
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => setCustomCategories(prev => prev.filter((_, i) => i !== idx))}
                              className="w-8 h-8 flex items-center justify-center bg-red-500 rounded text-white hover:bg-red-600"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      {/* Add Category button */}
                      <button
                        type="button"
                        onClick={() => setCustomCategories(prev => [...prev, { id: uuidv4(), name: '', emoji: '' }])}
                        className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition mb-4"
                      >
                        <Plus className="w-4 h-4" /> Add Category
                      </button>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={async () => { await saveThemesToSupabase(); setEditCategoriesOpen(false); }} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Done</button>
                      </div>
                      {/* Emoji picker logic/modal here, if openEmojiPicker is triggered */}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Step 4: Contact */}
            {step === 3 && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How should we contact you?</label>
              <div className="space-y-2">
                {contactMethods.map((method) => (
                  <label key={method.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.contact_methods.includes(method.id)}
                      onChange={() => handleContactMethodToggle(method.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <method.icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{method.label}</span>
                  </label>
                ))}
              </div>
            {formData.contact_methods.includes('email') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, contact_email: e.target.value }));
                        setEmailError('');
                      }}
                      onBlur={() => {
                        if (formData.contact_email && !validateEmail(formData.contact_email)) {
                          setEmailError('Please enter a valid email address.');
                        } else {
                          setEmailError('');
                        }
                      }}
                      className={inputClass}
                  placeholder="email@example.com"
                />
                    {emailError && <span className="text-xs text-red-500 mt-1 block">{emailError}</span>}
              </div>
            )}
                {(formData.contact_methods.includes('sms') || formData.contact_methods.includes('call')) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, contact_phone: e.target.value }));
                        setPhoneError('');
                      }}
                      onBlur={() => {
                        if (formData.contact_phone && !validatePhone(formData.contact_phone)) {
                          setPhoneError('Please enter a valid phone number.');
                        } else {
                          setPhoneError('');
                        }
                      }}
                      className={inputClass}
                  placeholder="+1 (555) 123-4567"
                />
                    {phoneError && <span className="text-xs text-red-500 mt-1 block">{phoneError}</span>}
                  </div>
                )}
              </div>
            )}
            {/* Step 5: Persistence */}
            {step === 4 && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How persistent should the reminder be?</label>
              <div className="space-y-2">
                {persistenceOptions.map((option) => (
                  <label key={option.id} className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="persistence"
                      value={option.id}
                      checked={formData.persistence === option.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, persistence: e.target.value }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            {/* Remove UI for custom repeat settings and only show the 'once' option in the persistence step */}
              </div>
            )}
            {/* Actions */}
            <div className="flex justify-between space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Back
              </button>
              {/* Next button: always enabled, but triggers shake and color animation if canAdvance() is false */}
              {step < steps.length - 1 ? (
                <div className="flex flex-col items-end w-full">
                  <button
                    ref={nextBtnRef}
                    type="button"
                    onClick={nextStep}
                    className={cn(
                      "px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200",
                      shakeNext ? "bg-red-600 text-white animate-shake" : canAdvance() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-white cursor-not-allowed"
                    )}
                    style={{
                      animation: shakeNext ? 'shake 0.4s' : undefined
                    }}
                  >
                    Next
                  </button>
                  {showValidationMsg && (
                    <span className="text-xs text-red-500 mt-2">Please fill in all required fields before continuing.</span>
                  )}
                  <style jsx>{`
                    @keyframes shake {
                      0% { transform: translateX(0); }
                      20% { transform: translateX(-8px); }
                      40% { transform: translateX(8px); }
                      60% { transform: translateX(-8px); }
                      80% { transform: translateX(8px); }
                      100% { transform: translateX(0); }
                    }
                    .animate-shake {
                      animation: shake 0.4s;
                    }
                  `}</style>
                </div>
              ) : (
              <button
                type="submit"
                  disabled={!isFormValid()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                  {reminder ? 'Update Reminder' : 'Set Reminder'}
              </button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 