'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RouteGuard from '../../components/RouteGuard';
import { Briefcase, User, FileText, Clock, Search, Shield, ClipboardCheck, Gift } from 'lucide-react';
import Link from 'next/link';

export default function CandidateDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect non-candidates away
  useEffect(() => {
    if (!loading && user) {
      const isCandidate = user.roles?.some(r => r.toLowerCase() === 'job candidate') ?? false;
      if (!isCandidate) {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard requiredRoles={['Job Candidate']}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user?.firstName || 'Candidate'}!
          </h1>
          <p className="text-slate-500 mt-1">
            Track your job applications and manage your profile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Browse Jobs Card (REC-007) */}
          <Link
            href="/candidate/jobs"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Browse Jobs</h3>
                <p className="text-sm text-slate-500">Find and apply for positions</p>
              </div>
            </div>
          </Link>

          {/* My Applications Card (REC-017) */}
          <Link
            href="/candidate/applications"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">My Applications</h3>
                <p className="text-sm text-slate-500">Track your application status</p>
              </div>
            </div>
          </Link>

          {/* My Offers Card (REC-018) */}
          <Link
            href="/candidate/offers"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">My Offers</h3>
                <p className="text-sm text-slate-500">Review and accept offers</p>
              </div>
            </div>
          </Link>

          {/* My Profile Card */}
          <Link
            href="/candidate/profile"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">My Profile</h3>
                <p className="text-sm text-slate-500">Update your profile and resume</p>
              </div>
            </div>
          </Link>

          {/* My Onboarding Card (ONB-004, ONB-005, ONB-007) */}
          <Link
            href="/candidate/onboarding"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">My Onboarding</h3>
                <p className="text-sm text-slate-500">View and complete onboarding tasks</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Tips</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Browse open positions</p>
                <p className="text-sm text-slate-500">Check out available job openings and apply with your resume (REC-007)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Keep your profile updated</p>
                <p className="text-sm text-slate-500">Make sure your resume and contact information are current</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Track your application status</p>
                <p className="text-sm text-slate-500">View real-time updates and history of your applications (REC-017)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Your data is protected</p>
                <p className="text-sm text-slate-500">We require consent before processing your personal data (REC-028, GDPR compliant)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ClipboardCheck className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Complete onboarding tasks</p>
                <p className="text-sm text-slate-500">View your onboarding tracker, upload documents, and receive task reminders (ONB-004, ONB-005, ONB-007)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
