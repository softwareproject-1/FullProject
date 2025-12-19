'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import { User, Mail, Phone, FileText, Upload, CheckCircle, AlertCircle, FileCheck, Edit2, Save, X } from 'lucide-react';
import { onboardingApi } from '@/services/api';
import { candidateApi, Candidate, UpdateCandidateData } from '@/utils/candidateApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CandidateProfile() {
  const { user, loading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingForm, setUploadingForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [contractId, setContractId] = useState('');
  const [onboardingId, setOnboardingId] = useState('');
  const [loadingIds, setLoadingIds] = useState(true);

  // Profile editing form data (from incoming changes)
  const [formData, setFormData] = useState<UpdateCandidateData>({
    firstName: '',
    middleName: '',
    lastName: '',
    personalEmail: '',
    mobilePhone: '',
    homePhone: '',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    address: {
      streetAddress: '',
      city: '',
      country: '',
      // Note: state and postalCode are not supported by backend AddressDto
    },
  });

  // ISSUE-005 FIX: Auto-fetch Contract and Onboarding IDs when component loads (our changes)
  useEffect(() => {
    const fetchUserOnboardingData = async () => {
      if (!user?.id) {
        setLoadingIds(false);
        return;
      }

      try {
        // Use the new getByUserId endpoint that works for both candidates and employees
        const response = await onboardingApi.tracker.getByUserId(user.id);
        if (response.data) {
          setContractId(response.data.contractId || '');
          // Use onboardingId if available, otherwise try common ID fields
          const fetchedOnboardingId = (response.data as any).onboardingId ||
            (response.data as any)._id ||
            '';
          setOnboardingId(fetchedOnboardingId);
          console.log('[PROFILE] Auto-fetched onboarding data:', {
            contractId: response.data.contractId,
            onboardingId: fetchedOnboardingId,
          });
        }
      } catch (err) {
        // User doesn't have an onboarding record yet - this is expected for new candidates
        console.log('[PROFILE] No onboarding record found - IDs will stay empty');
      } finally {
        setLoadingIds(false);
      }
    };

    fetchUserOnboardingData();
  }, [user?.id]);

  // Fetch candidate profile (from incoming changes)
  useEffect(() => {
    const fetchCandidateProfile = async () => {
      if (!user || authLoading) return;

      try {
        setLoading(true);
        let candidateData: Candidate | null = null;

        // Try to get candidate profile by email first
        if (user.personalEmail) {
          try {
            candidateData = await candidateApi.getMyCandidateProfileByEmail(user.personalEmail);
          } catch (err) {
            console.log('Could not find candidate by email, trying national ID...');
          }
        }

        // If not found by email, try by national ID
        if (!candidateData && user.nationalId) {
          try {
            candidateData = await candidateApi.getMyCandidateProfileByNationalId(user.nationalId);
          } catch (err) {
            console.log('Could not find candidate by national ID');
          }
        }

        if (candidateData) {
          setCandidate(candidateData);
          setFormData({
            firstName: candidateData.firstName || '',
            middleName: candidateData.middleName || '',
            lastName: candidateData.lastName || '',
            personalEmail: candidateData.personalEmail || '',
            mobilePhone: candidateData.mobilePhone || '',
            homePhone: candidateData.homePhone || '',
            gender: candidateData.gender || '',
            maritalStatus: candidateData.maritalStatus || '',
            dateOfBirth: candidateData.dateOfBirth ? candidateData.dateOfBirth.split('T')[0] : '',
            address: candidateData.address ? {
              streetAddress: candidateData.address.streetAddress || '',
              city: candidateData.address.city || '',
              country: candidateData.address.country || '',
              // Exclude state and postalCode as backend doesn't support them
            } : {
              streetAddress: '',
              city: '',
              country: '',
            },
          });
        } else {
          setMessage({ type: 'error', text: 'Candidate profile not found. Please contact HR.' });
        }
      } catch (err: any) {
        console.error('Error fetching candidate profile:', err);
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to load candidate profile'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateProfile();
  }, [user, authLoading]);

  const handleInputChange = (field: keyof UpdateCandidateData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      } as any,
    }));
  };

  const handleSave = async () => {
    if (!candidate?._id && !candidate?.id) {
      setMessage({ type: 'error', text: 'Candidate profile not found' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const candidateId = candidate._id || candidate.id || '';

      // Prepare update data - only include fields that backend accepts
      // Backend AddressDto only accepts: city, streetAddress, country (not state or postalCode)
      const updateData: UpdateCandidateData = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        personalEmail: formData.personalEmail,
        mobilePhone: formData.mobilePhone,
        homePhone: formData.homePhone,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        dateOfBirth: formData.dateOfBirth,
        address: {
          streetAddress: formData.address?.streetAddress,
          city: formData.address?.city,
          country: formData.address?.country,
          // Exclude state and postalCode as backend doesn't accept them
        },
      };

      await candidateApi.updateMyCandidateProfile(candidateId, updateData);

      // Reload candidate data
      const updatedCandidate = await candidateApi.getCandidateById(candidateId);
      setCandidate(updatedCandidate);

      // Update formData to match the response (which won't have state/postalCode)
      if (updatedCandidate) {
        setFormData({
          ...formData,
          address: updatedCandidate.address || {
            streetAddress: '',
            city: '',
            country: '',
          },
        });
      }

      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      console.error('Error updating candidate profile:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original candidate data
    if (candidate) {
      setFormData({
        firstName: candidate.firstName || '',
        middleName: candidate.middleName || '',
        lastName: candidate.lastName || '',
        personalEmail: candidate.personalEmail || '',
        mobilePhone: candidate.mobilePhone || '',
        homePhone: candidate.homePhone || '',
        gender: candidate.gender || '',
        maritalStatus: candidate.maritalStatus || '',
        dateOfBirth: candidate.dateOfBirth ? candidate.dateOfBirth.split('T')[0] : '',
        address: candidate.address ? {
          streetAddress: candidate.address.streetAddress || '',
          city: candidate.address.city || '',
          country: candidate.address.country || '',
          // Exclude state and postalCode as backend doesn't support them
        } : {
          streetAddress: '',
          city: '',
          country: '',
        },
      });
    }
    setEditing(false);
    setMessage(null);
  };

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
      // Convert file to base64 for storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // 1. Update the contract with signature URL (original functionality)
      const signatureUrl = `https://storage.example.com/contracts/${contractId}/${file.name}`;
      await onboardingApi.contracts.uploadSigned(contractId, {
        signatureUrl,
        signedAt: new Date().toISOString(),
      });

      // 2. ALSO upload to Documents collection so HR can see it in Documents tab (ONB-007)
      if (onboardingId) {
        try {
          await onboardingApi.documents.upload({
            onboardingId: onboardingId,
            documentType: 'CONTRACT',
            filePath: base64Data,
            documentName: file.name,
          });
          console.log('[PROFILE] Document also uploaded to Documents collection for HR visibility');
        } catch (docErr) {
          console.warn('[PROFILE] Could not upload to Documents collection:', docErr);
          // Don't fail the whole operation if this secondary upload fails
        }
      }

      setMessage({ type: 'success', text: 'Signed contract uploaded successfully! HR will review it shortly.' });
      e.target.value = ''; // Reset input
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

  if (authLoading || loading) {
    return (
      <RouteGuard requiredRoles={['Job Candidate']}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredRoles={['Job Candidate']}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500 mt-1">View and update your candidate profile information</p>
          </div>
          {candidate && !editing && (
            <Button
              onClick={() => setEditing(true)}
              variant="default"
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p>{message.text}</p>
          </div>
        )}

        {!candidate ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-slate-600">Candidate profile not found. Please contact HR.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                  {candidate.firstName?.[0] || user?.firstName?.[0]}{candidate.lastName?.[0] || user?.lastName?.[0]}
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {candidate.firstName} {candidate.middleName} {candidate.lastName}
                  </h2>
                  <p className="text-white/80">Job Candidate</p>
                  {candidate.candidateNumber && (
                    <p className="text-white/60 text-sm mt-1">Candidate #: {candidate.candidateNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {editing ? (
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.firstName || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    {editing ? (
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.middleName || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {editing ? (
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.lastName || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    {editing ? (
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">
                        {candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    {editing ? (
                      <select
                        id="gender"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.gender || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    {editing ? (
                      <select
                        id="maritalStatus"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.maritalStatus}
                        onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </select>
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.maritalStatus || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="personalEmail">Personal Email</Label>
                    {editing ? (
                      <Input
                        id="personalEmail"
                        type="email"
                        value={formData.personalEmail}
                        onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.personalEmail || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobilePhone">Mobile Phone</Label>
                    {editing ? (
                      <Input
                        id="mobilePhone"
                        type="tel"
                        value={formData.mobilePhone}
                        onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.mobilePhone || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homePhone">Home Phone</Label>
                    {editing ? (
                      <Input
                        id="homePhone"
                        type="tel"
                        value={formData.homePhone}
                        onChange={(e) => handleInputChange('homePhone', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.homePhone || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    {editing ? (
                      <Input
                        id="streetAddress"
                        value={formData.address?.streetAddress}
                        onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.address?.streetAddress || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    {editing ? (
                      <Input
                        id="city"
                        value={formData.address?.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.address?.city || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    {editing ? (
                      <Input
                        id="country"
                        value={formData.address?.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{candidate.address?.country || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Status (Read-only) */}
              {candidate.status && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Application Status</h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Status: <span className="font-medium text-slate-900">{candidate.status}</span></p>
                    {candidate.applicationDate && (
                      <p className="text-sm text-slate-600 mt-2">
                        Application Date: <span className="font-medium text-slate-900">
                          {new Date(candidate.applicationDate).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Edit Actions */}
              {editing && (
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={saving}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}

              {/* Resume Section */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resume / CV
                </h3>
                {candidate.resumeUrl ? (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Resume uploaded</p>
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View Resume
                    </a>
                  </div>
                ) : (
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
                )}
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
        )}
      </div>
    </RouteGuard>
  );
}
