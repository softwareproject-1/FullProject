'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import RouteGuard from '../../../components/RouteGuard';
import { recruitmentApi } from '../../../services/api';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Users, 
  Search, 
  FileText, 
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  Shield
} from 'lucide-react';

interface JobRequisition {
  _id: string;
  requisitionId: string;
  templateId?: string | {
    _id: string;
    title: string;
    department: string;
    qualifications?: string[];
    skills?: string[];
    description?: string;
  };
  openings: number;
  location?: string;
  publishStatus: string;
  postingDate?: string;
  expiryDate?: string;
}

interface ConsentFormData {
  dataProcessingConsent: boolean;
  backgroundCheckConsent: boolean;
  consentText: string;
}

export default function CandidateJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [myApplications, setMyApplications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Apply modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRequisition | null>(null);
  const [applyStep, setApplyStep] = useState<'consent' | 'resume' | 'confirm'>('consent');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Consent form state (REC-028)
  const [consentForm, setConsentForm] = useState<ConsentFormData>({
    dataProcessingConsent: false,
    backgroundCheckConsent: false,
    consentText: '',
  });

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await recruitmentApi.jobs.getPublished();
      setJobs(response.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Unable to load job listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyApplications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await recruitmentApi.applications.getByCandidate(user.id);
      // Extract requisition IDs from my applications
      const appliedRequisitionIds = response.data.map((app: any) => 
        app.requisitionId?._id || app.requisitionId
      );
      setMyApplications(appliedRequisitionIds);
    } catch (err) {
      console.error('Failed to fetch my applications:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchJobs();
    fetchMyApplications();
  }, [fetchJobs, fetchMyApplications]);

  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    const template = typeof job.templateId === 'object' ? job.templateId : null;
    const title = template?.title?.toLowerCase() || '';
    const department = template?.department?.toLowerCase() || '';
    const location = job.location?.toLowerCase() || '';
    return title.includes(searchLower) || department.includes(searchLower) || location.includes(searchLower);
  });

  const hasApplied = (jobId: string) => myApplications.includes(jobId);

  const openApplyModal = (job: JobRequisition) => {
    setSelectedJob(job);
    setApplyStep('consent');
    setConsentForm({
      dataProcessingConsent: false,
      backgroundCheckConsent: false,
      consentText: '',
    });
    setResumeUrl('');
    setResumeFile(null);
    setApplyMessage(null);
    setIsApplyModalOpen(true);
  };

  const closeApplyModal = () => {
    setIsApplyModalOpen(false);
    setSelectedJob(null);
    setApplyStep('consent');
  };

  const handleConsentNext = () => {
    if (!consentForm.dataProcessingConsent || !consentForm.backgroundCheckConsent) {
      setApplyMessage({ type: 'error', text: 'You must agree to both consent items to proceed.' });
      return;
    }
    setApplyMessage(null);
    setApplyStep('resume');
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setApplyMessage({ type: 'error', text: 'Resume file must be less than 5MB' });
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setApplyMessage({ type: 'error', text: 'Only PDF, DOC, and DOCX files are allowed' });
        return;
      }

      setResumeFile(file);
      setApplyMessage({ type: 'success', text: 'Uploading resume...' });

      try {
        // Upload to backend
        const response = await recruitmentApi.documents.uploadCV(user!.id, file);
        setResumeUrl(response.data.resumeUrl);
        setApplyMessage({ type: 'success', text: 'Resume uploaded successfully!' });
      } catch (err: any) {
        console.error('Failed to upload resume:', err);
        setApplyMessage({ 
          type: 'error', 
          text: err.response?.data?.message || 'Failed to upload resume. Please try again.' 
        });
        setResumeFile(null);
      }
    }
  };

  const handleResumeNext = () => {
    // Require resume before proceeding to confirmation
    if (!resumeUrl) {
      setApplyMessage({ 
        type: 'error', 
        text: 'Please upload your CV/resume before proceeding. A resume is required to submit your application.' 
      });
      return;
    }
    setApplyMessage(null);
    setApplyStep('confirm');
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob || !user?.id) return;

    // Validate consent before proceeding
    if (!consentForm.dataProcessingConsent || !consentForm.backgroundCheckConsent) {
      setApplyMessage({ 
        type: 'error', 
        text: 'Please accept both consent agreements before submitting your application.' 
      });
      return;
    }

    setIsSubmitting(true);
    setApplyMessage(null);

    let applicationId: string | null = null;

    try {
      // Step 1: Create the application (REC-007)
      // Note: user.id is the EmployeeProfile ID, backend will link to correct Candidate
      const applicationResponse = await recruitmentApi.applications.create({
        candidateId: user.id,
        requisitionId: selectedJob._id,
        resumeUrl: resumeUrl || undefined,
      });

      applicationId = applicationResponse.data._id;

      // Step 2: Submit consent (REC-028)
      try {
        await recruitmentApi.applications.submitConsent(applicationId, {
          dataProcessingConsent: consentForm.dataProcessingConsent,
          backgroundCheckConsent: consentForm.backgroundCheckConsent,
          consentText: consentForm.consentText || 'I agree to the processing of my personal data and background checks.',
          ipAddress: undefined, // Will be captured server-side
          userAgent: navigator.userAgent,
        });
      } catch (consentError: any) {
        // Consent failed but application was created - warn user
        console.error('Consent submission failed:', consentError);
        setApplyMessage({ 
          type: 'success', 
          text: 'Application created, but consent recording failed. Please update your consent in My Applications.' 
        });
        await fetchMyApplications();
        setTimeout(() => {
          closeApplyModal();
        }, 3000);
        return;
      }

      setApplyMessage({ type: 'success', text: 'Application submitted successfully! You can track your application status in My Applications.' });
      
      // Refresh my applications
      await fetchMyApplications();
      
      // Close modal after a delay
      setTimeout(() => {
        closeApplyModal();
      }, 2000);

    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setApplyMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to submit application. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <RouteGuard requiredRoles={['Job Candidate']}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Job Openings</h1>
          <p className="text-slate-500 mt-1">Browse and apply for available positions</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs by title, department, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">No Jobs Found</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'There are no open positions at the moment. Please check back later.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => {
              const alreadyApplied = hasApplied(job._id);
              const template = typeof job.templateId === 'object' ? job.templateId : null;
              return (
                <div
                  key={job._id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {template?.title || 'Untitled Position'}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {template?.department || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.openings} opening{job.openings !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {template?.description && (
                        <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {/* Skills & Qualifications */}
                      {(template?.skills?.length || template?.qualifications?.length) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {template?.skills?.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                          {(template?.skills?.length || 0) > 4 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                              +{(template?.skills?.length || 0) - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-slate-400">
                        Posted: {formatDate(job.postingDate)} 
                        {job.expiryDate && ` • Expires: ${formatDate(job.expiryDate)}`}
                      </div>
                    </div>

                    <div className="ml-4">
                      {alreadyApplied ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => openApplyModal(job)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Apply Modal */}
        {isApplyModalOpen && selectedJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Apply for {typeof selectedJob.templateId === 'object' ? selectedJob.templateId.title : 'Position'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Step {applyStep === 'consent' ? '1' : applyStep === 'resume' ? '2' : '3'} of 3
                  </p>
                </div>
                <button
                  onClick={closeApplyModal}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Message Banner */}
                {applyMessage && (
                  <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                    applyMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {applyMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p>{applyMessage.text}</p>
                  </div>
                )}

                {/* Step 1: Consent (REC-028) */}
                {applyStep === 'consent' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-900">Data Privacy & Consent</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Before submitting your application, please review and agree to our data processing policies.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentForm.dataProcessingConsent}
                          onChange={(e) => setConsentForm(prev => ({ ...prev, dataProcessingConsent: e.target.checked }))}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-slate-900">Personal Data Processing</p>
                          <p className="text-sm text-slate-500 mt-1">
                            I consent to the collection, processing, and storage of my personal data including my CV, 
                            contact information, and application details for recruitment purposes in accordance with 
                            GDPR and applicable privacy laws.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentForm.backgroundCheckConsent}
                          onChange={(e) => setConsentForm(prev => ({ ...prev, backgroundCheckConsent: e.target.checked }))}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-slate-900">Background Check Authorization</p>
                          <p className="text-sm text-slate-500 mt-1">
                            I authorize the company to conduct background verification checks including employment 
                            history, educational qualifications, and reference checks as part of the hiring process.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleConsentNext}
                        disabled={!consentForm.dataProcessingConsent || !consentForm.backgroundCheckConsent}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Resume Upload (REC-007) */}
                {applyStep === 'resume' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-slate-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-slate-900">Upload Your Resume/CV</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Upload your latest resume to help us learn more about your experience and qualifications.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                      {resumeFile ? (
                        <div className="space-y-3">
                          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                          <p className="font-medium text-slate-900">{resumeFile.name}</p>
                          <p className="text-sm text-slate-500">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <button
                            onClick={() => {
                              setResumeFile(null);
                              setResumeUrl('');
                            }}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove and upload different file
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-600 mb-2">
                            Drag and drop your resume here, or click to upload
                          </p>
                          <p className="text-sm text-slate-400">
                            Supports PDF, DOC, DOCX (max 5MB)
                          </p>
                          <input
                            type="file"
                            id="resume-upload-modal"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleResumeUpload}
                          />
                          <button
                            onClick={() => document.getElementById('resume-upload-modal')?.click()}
                            className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Choose File
                          </button>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                      Resume upload is optional but recommended for a complete application.
                    </p>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setApplyStep('consent')}
                        className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleResumeNext}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {applyStep === 'confirm' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">Review Your Application</h3>
                      <div className="space-y-2 text-sm text-green-800">
                        <p>✓ Data processing consent: Accepted</p>
                        <p>✓ Background check consent: Accepted</p>
                        <p>✓ Resume: {resumeFile ? resumeFile.name : 'Not uploaded'}</p>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-lg">
                      <h4 className="font-medium text-slate-900 mb-2">Position Details</h4>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Title:</strong> {typeof selectedJob.templateId === 'object' ? selectedJob.templateId.title : 'N/A'}</p>
                        <p><strong>Department:</strong> {typeof selectedJob.templateId === 'object' ? selectedJob.templateId.department : 'N/A'}</p>
                        <p><strong>Location:</strong> {selectedJob.location || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setApplyStep('resume')}
                        disabled={isSubmitting}
                        className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmitApplication}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Submitting...
                          </>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
