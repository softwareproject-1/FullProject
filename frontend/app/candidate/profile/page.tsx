'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import RouteGuard from '../../../components/RouteGuard';
import { User, Mail, Phone, FileText, Upload, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';
import { onboardingApi } from '../../../services/api';

export default function CandidateProfile() {
  const { user } = useAuth();
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingForm, setUploadingForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [contractId, setContractId] = useState('');
  const [onboardingId, setOnboardingId] = useState('');

  return (
    <RouteGuard requiredRoles={['Job Candidate']}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your candidate profile and resume</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-white/80">Job Candidate</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Work Email</p>
                    <p className="text-sm font-medium text-slate-900">
                      {user?.workEmail || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Personal Email</p>
                    <p className="text-sm font-medium text-slate-900">
                      {user?.personalEmail || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Banner */}
            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p>{message.text}</p>
              </div>
            )}

            {/* Resume Section */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resume / CV
              </h3>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">
                  Drag and drop your resume here, or click to upload
                </p>
                <p className="text-sm text-slate-400">
                  Supports PDF, DOC, DOCX (max 5MB)
                </p>
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleResumeUpload}
                  disabled={uploadingResume}
                />
                <button
                  onClick={() => document.getElementById('resume-upload')?.click()}
                  disabled={uploadingResume}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                </button>
              </div>
            </div>

            {/* Signed Contract Section */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Signed Contract
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Contract ID"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-2">
                    Upload your signed employment contract
                  </p>
                  <p className="text-sm text-slate-400">
                    Supports PDF (max 10MB)
                  </p>
                  <input
                    type="file"
                    id="contract-upload"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleContractUpload}
                    disabled={uploadingContract || !contractId}
                  />
                  <button
                    onClick={() => document.getElementById('contract-upload')?.click()}
                    disabled={uploadingContract || !contractId}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingContract ? 'Uploading...' : 'Upload Signed Contract'}
                  </button>
                  {!contractId && (
                    <p className="text-xs text-amber-600 mt-2">Please enter your Contract ID first</p>
                  )}
                </div>
              </div>
            </div>

            {/* Onboarding Forms Section */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Required Onboarding Forms
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Onboarding ID (provided by HR)"
                  value={onboardingId}
                  onChange={(e) => setOnboardingId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-2">
                    Upload completed onboarding forms and templates
                  </p>
                  <p className="text-sm text-slate-400">
                    Supports PDF, DOC, DOCX (max 10MB)
                  </p>
                  <input
                    type="file"
                    id="form-upload"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFormUpload}
                    disabled={uploadingForm || !onboardingId}
                  />
                  <button
                    onClick={() => document.getElementById('form-upload')?.click()}
                    disabled={uploadingForm || !onboardingId}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingForm ? 'Uploading...' : 'Upload Form'}
                  </button>
                  {!onboardingId && (
                    <p className="text-xs text-amber-600 mt-2">Please enter your Onboarding ID first</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Profile Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Keep your resume updated with your latest experience</li>
                <li>• Upload your signed contract once you receive it from HR</li>
                <li>• Complete all required onboarding forms to start your journey</li>
                <li>• Contact HR if you haven't received your Contract ID or Onboarding ID</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );

  // Upload handlers
  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Resume file size must be less than 5MB' });
      return;
    }

    setUploadingResume(true);
    setMessage(null);

    try {
      // In a real implementation, this would upload to a file storage service
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
      e.target.value = ''; // Reset input
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to upload resume. Please try again.' });
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleContractUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !contractId) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Contract file size must be less than 10MB' });
      return;
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      setMessage({ type: 'error', text: 'Only PDF files are accepted for contracts' });
      return;
    }

    setUploadingContract(true);
    setMessage(null);

    try {
      // Simulate file upload to storage and get URL
      // In production, upload to S3/Azure/etc and get the URL
      const signatureUrl = `https://storage.example.com/contracts/${contractId}/${file.name}`;
      
      await onboardingApi.contracts.uploadSigned(contractId, {
        signatureUrl,
        signedAt: new Date().toISOString(),
      });
      
      setMessage({ type: 'success', text: 'Signed contract uploaded successfully! HR will review it shortly.' });
      e.target.value = ''; // Reset input
      setContractId(''); // Clear contract ID
    } catch (error: any) {
      console.error('Failed to upload contract:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload contract. Please check your Contract ID and try again.' 
      });
    } finally {
      setUploadingContract(false);
    }
  }

  async function handleFormUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onboardingId) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Form file size must be less than 10MB' });
      return;
    }

    setUploadingForm(true);
    setMessage(null);

    try {
      // Simulate file upload to storage and get URL
      // In production, upload to S3/Azure/etc and get the URL
      const fileUrl = `https://storage.example.com/forms/${onboardingId}/${file.name}`;
      
      await onboardingApi.forms.upload(onboardingId, {
        formType: 'general',
        formUrl: fileUrl,
        fileName: file.name,
      });
      
      setMessage({ type: 'success', text: 'Onboarding form uploaded successfully!' });
      e.target.value = ''; // Reset input
    } catch (error: any) {
      console.error('Failed to upload form:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload form. Please check your Onboarding ID and try again.' 
      });
    } finally {
      setUploadingForm(false);
    }
  }
}
