'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

type Tab = 'profile' | 'security' | 'subscription';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);

  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Verification
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getSubscriptions().catch(() => [])])
      .then(([profile, subs]) => {
        setUser(profile);
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setSubscriptions(subs);
      })
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const updated = await api.updateProfile({ firstName, lastName });
      setUser(updated);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      setPasswordMessage({
        type: 'error',
        text: 'Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number.',
      });
      return;
    }

    setPasswordSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.deleteAccount(deletePassword);
      api.clearToken();
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage(null);
    try {
      await api.resendVerification();
      setVerificationMessage('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setVerificationMessage(err.message || 'Failed to send verification email.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleCancelSubscription = async (subId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await api.cancelSubscription(subId);
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? { ...s, status: 'CANCELLED' } : s)));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription.');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'subscription', label: 'Subscriptions' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600 mb-8">Manage your profile, security, and subscriptions.</p>

          {/* Email verification banner */}
          {user && !user.emailVerified && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Email not verified</p>
                <p className="text-sm text-amber-700 mt-1">
                  Please verify your email address to access all features.
                </p>
                {verificationMessage && (
                  <p className="text-sm text-amber-800 font-medium mt-1">{verificationMessage}</p>
                )}
              </div>
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="text-sm font-medium text-amber-700 hover:text-amber-900 underline disabled:opacity-50"
              >
                {resendingVerification ? 'Sending...' : 'Resend'}
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="input bg-gray-50" value={user?.email || ''} disabled />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your email address.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      className="input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      className="input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {profileMessage && (
                  <div
                    className={`rounded-xl p-3 text-sm ${
                      profileMessage.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    {profileMessage.text}
                  </div>
                )}

                <button type="submit" disabled={profileSaving} className="btn-primary disabled:opacity-50">
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Change Password */}
              <div className="card">
                <h2 className="font-display text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      className="input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      className="input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must include uppercase, lowercase, and a number.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      className="input"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  {passwordMessage && (
                    <div
                      className={`rounded-xl p-3 text-sm ${
                        passwordMessage.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-700'
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}
                    >
                      {passwordMessage.text}
                    </div>
                  )}

                  <button type="submit" disabled={passwordSaving} className="btn-primary disabled:opacity-50">
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Delete Account */}
              <div className="card border-red-200">
                <h2 className="font-display text-xl font-semibold text-red-900 mb-2">Delete Account</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    I want to delete my account
                  </button>
                ) : (
                  <div className="space-y-4 border-t border-red-100 pt-4">
                    <p className="text-sm font-medium text-red-800">
                      This will permanently delete your account, all your books, orders, and subscriptions. Enter your password to confirm.
                    </p>
                    <input
                      type="password"
                      className="input"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                    {deleteError && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        {deleteError}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                          setDeleteError(null);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscription' && (
            <div className="card">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-6">Your Subscriptions</h2>

              {subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  <p className="text-gray-500 mb-4">You don&apos;t have any active subscriptions.</p>
                  <Link href="/book/create" className="btn-primary inline-block text-sm">
                    Create a Book
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{sub.type?.replace('_', ' ') || 'Subscription'}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Status:{' '}
                            <span
                              className={`font-medium ${
                                sub.status === 'ACTIVE' ? 'text-green-600' : sub.status === 'CANCELLED' ? 'text-red-600' : 'text-gray-600'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </p>
                          {sub.currentPeriodEnd && (
                            <p className="text-sm text-gray-500">
                              {sub.status === 'CANCELLED' ? 'Access until' : 'Renews'}: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {sub.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              Back to My Books
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
