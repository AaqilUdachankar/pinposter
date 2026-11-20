import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  User,
  Shield,
  Clock,
  Save,
  KeyRound,
  FileText,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
];

export default function AccountSettings() {
  const { user, updateUser, deleteAccount } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [defaultDisclosure, setDefaultDisclosure] = useState('');
  const [includeDisclosure, setIncludeDisclosure] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion fields
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTimezone(user.timezone || 'Asia/Kolkata');
      setIncludeDisclosure(user.preferences?.includeDisclosure !== false);
      setDefaultDisclosure(
        user.preferences?.defaultDisclosure ||
        '#ad #affiliate When you buy through our links, we may earn an affiliate commission.'
      );
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name,
        timezone,
        preferences: {
          defaultDisclosure,
          includeDisclosure,
        },
      });

      if (res.data.success) {
        updateUser(res.data.user);
        toast.success('Account preferences saved successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal profile, scheduling timezone, default affiliate disclosures, and credentials
        </p>
      </div>

      {/* Profile & Scheduling Preferences */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Profile &amp; Timezone Preferences</h3>
            <p className="text-xs text-slate-500">Your information and global hourly scheduling settings</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduler Queue Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz} {tz === 'Asia/Kolkata' ? '(Default Standard)' : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                All 10 consecutive hourly slots will be calculated and displayed in this timezone.
              </span>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Default Affiliate Disclosure Text
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${includeDisclosure
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                  >
                    {includeDisclosure ? 'ON (Attached)' : 'OFF (Disabled)'}
                  </span>
                </div>

                {/* ON / OFF Switch */}
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold ${includeDisclosure ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {includeDisclosure ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncludeDisclosure(!includeDisclosure)}
                    aria-label="Toggle Affiliate Disclosure"
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeDisclosure ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeDisclosure ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {includeDisclosure ? (
                <div>
                  <textarea
                    rows={3}
                    value={defaultDisclosure}
                    onChange={(e) => setDefaultDisclosure(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Automatically appended to each generated Pinterest Pin description to ensure legal compliance.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
                  Affiliate disclosure is turned <strong>OFF</strong>. Pins will be generated with clean descriptions without disclosure tags.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Change Password</h3>
            <p className="text-xs text-slate-500">Update your account login password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Data Deletion & Account Removal */}
      <div className="p-6 sm:p-8 rounded-3xl bg-rose-50/50 border border-rose-200 shadow-soft space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-rose-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-rose-950 text-base">Danger Zone: Delete Account &amp; Personal Data</h3>
            <p className="text-xs text-rose-700">Right to be Forgotten — permanently remove all your data</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-rose-800 leading-relaxed">
            Permanently deletes your user account, email address, all campaigns, Pins, boards, products, and encrypted API keys. 
            Once confirmed, this data cannot be recovered.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Account &amp; All Data</span>
            </button>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!deletePassword) return;
                setIsDeleting(true);
                try {
                  await deleteAccount(deletePassword);
                  toast.success('Your account and personal data have been permanently deleted.');
                } catch (err) {
                  toast.error(err.response?.data?.message || err.message || 'Deletion failed');
                  setIsDeleting(false);
                }
              }}
              className="p-4 rounded-2xl bg-white border border-rose-200 space-y-3 max-w-lg"
            >
              <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Deletion with Your Password:</span>
              </div>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting Everything...' : 'Confirm Permanent Deletion'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
