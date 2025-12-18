'use client'

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import RouteGuard from '../../../components/RouteGuard';
import { CheckCircle, XCircle, Clock, FileText, PenLine, AlertCircle } from 'lucide-react';
import { recruitmentApi } from '../../../services/api';
import { Modal } from '../../../components/Modal';
import { Offer } from '../../../lib/types';
import axios from '../../../lib/axios';

export default function CandidateOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateProfileId, setCandidateProfileId] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');
  const [signerId, setSignerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // First, fetch the candidate profile ID for this user
  useEffect(() => {
    const fetchCandidateProfile = async () => {
      if (!user?.id) return;
      
      try {
        // Get candidate profile linked to the employee profile (user.id is employee profile ID)
        const response = await axios.get(`/employee-profile/candidates/by-employee-profile/${user.id}`);
        
        console.log('Candidate profile found:', response.data);
        setCandidateProfileId(response.data._id);
      } catch (error: any) {
        console.error('Failed to fetch candidate profile:', error);
        // If candidate profile doesn't exist, user might still see offers if userId matches
        setCandidateProfileId(user.id); // Fallback to user.id for backwards compatibility
      }
    };
    
    fetchCandidateProfile();
  }, [user?.id]);

  // Fetch offers function - defined with useCallback so it can be reused
  const fetchOffers = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch all offers
      const offersResponse = await recruitmentApi.offers.getAll();
      console.log('All offers:', offersResponse.data);
      console.log('User ID:', user.id);
      
      // First try to get applications for this user to find their application IDs
      let myApplicationIds: string[] = [];
      try {
        const appsResponse = await recruitmentApi.applications.getByCandidate(user.id);
        myApplicationIds = appsResponse.data.map((app: any) => app._id);
        console.log('My application IDs:', myApplicationIds);
      } catch (err) {
        console.log('Could not fetch applications by candidateId, trying fallback...');
        // Fallback: fetch all and filter
        try {
          const allAppsResponse = await recruitmentApi.applications.getAll();
          myApplicationIds = allAppsResponse.data
            .filter((app: any) => {
              const appCandidateId = typeof app.candidateId === 'object' && app.candidateId !== null
                ? app.candidateId._id?.toString()
                : app.candidateId?.toString();
              return appCandidateId === user.id || 
                     appCandidateId === candidateProfileId ||
                     app.candidateId?._id === user.id;
            })
            .map((app: any) => app._id);
          console.log('My application IDs (fallback):', myApplicationIds);
        } catch (fallbackErr) {
          console.log('Could not fetch applications:', fallbackErr);
        }
      }
      
      // Filter offers that belong to this candidate
      const candidateOffers = offersResponse.data.filter((offer: any) => {
        // Method 1: Match by applicationId
        if (offer.applicationId && myApplicationIds.length > 0) {
          const offerAppId = typeof offer.applicationId === 'object' && offer.applicationId !== null
            ? offer.applicationId._id?.toString()
            : offer.applicationId?.toString();
          
          if (myApplicationIds.includes(offerAppId)) {
            console.log('Matched offer by applicationId:', offer._id);
            return true;
          }
        }
        
        // Method 2: Direct candidateId match with user.id
        if (offer.candidateId) {
          const offerCandidateId = typeof offer.candidateId === 'object' && offer.candidateId !== null
            ? offer.candidateId._id?.toString()
            : offer.candidateId?.toString();
          
          if (offerCandidateId === user.id || offerCandidateId === candidateProfileId) {
            console.log('Matched offer by candidateId:', offer._id);
            return true;
          }
        }
        
        return false;
      });
      
      console.log('Filtered offers for candidate:', candidateOffers);
      setOffers(candidateOffers);
    } catch (error: any) {
      console.error('Failed to fetch offers:', error);
      setMessage({ type: 'error', text: 'Failed to load offers' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, candidateProfileId]);

  // Fetch offers when dependencies change
  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleAccept = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsResponseModalOpen(true);
  };

  const handleReject = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsResponseModalOpen(true);
  };

  const submitResponse = async (response: 'accepted' | 'rejected') => {
    if (!selectedOffer) return;

    try {
      setSubmitting(true);
      await recruitmentApi.offers.respond(selectedOffer._id, {
        response,
        notes: responseNotes
      });
      
      setMessage({ 
        type: 'success', 
        text: `Offer ${response === 'accepted' ? 'accepted' : 'rejected'} successfully!` 
      });
      
      setIsResponseModalOpen(false);
      setResponseNotes('');
      setSelectedOffer(null);
      fetchOffers();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit response' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSign = (offer: Offer) => {
    setSelectedOffer(offer);
    setSignerId(user?.id || '');
    setIsSignModalOpen(true);
  };

  const submitSignature = async () => {
    if (!selectedOffer || !signerId) return;

    try {
      setSubmitting(true);
      await recruitmentApi.offers.sign(selectedOffer._id, {
        signerId,
        role: 'candidate'
      });
      
      setMessage({ type: 'success', text: 'Offer signed successfully!' });
      setIsSignModalOpen(false);
      setSignerId('');
      setSelectedOffer(null);
      fetchOffers();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to sign offer' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (offer: Offer) => {
    if (offer.applicantResponse === 'accepted') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Accepted</span>;
    } else if (offer.applicantResponse === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Rejected</span>;
    } else {
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending Response</span>;
    }
  };

  if (loading) {
    return (
      <RouteGuard requiredRoles={['Job Candidate']}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-500">Loading offers...</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredRoles={['Job Candidate']}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Offers</h1>
          <p className="text-slate-500 mt-1">Review and respond to job offers</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p>{message.text}</p>
            </div>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Offers Yet</h3>
            <p className="text-slate-500">
              You haven't received any job offers. Keep applying!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{offer.role}</h3>
                    <p className="text-slate-500">
                      Application: {
                        typeof offer.applicationId === 'object' 
                          ? (offer.applicationId as any)?._id?.toString().slice(-6).toUpperCase() || 'N/A'
                          : offer.applicationId.toString().slice(-6).toUpperCase()
                      }
                    </p>
                  </div>
                  {getStatusBadge(offer)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-600">Salary</p>
                    <p className="font-semibold text-slate-900">
                      ${offer.grossSalary.toLocaleString()}/year
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Deadline</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(offer.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <p className="font-semibold text-slate-900 capitalize">{offer.finalStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Received</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Signature Status */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">Signature Status</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {offer.candidateSignedAt ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="text-sm text-slate-600">
                        You {offer.candidateSignedAt ? 'signed' : 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {offer.hrSignedAt ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="text-sm text-slate-600">
                        HR {offer.hrSignedAt ? 'signed' : 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {offer.managerSignedAt ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="text-sm text-slate-600">
                        Manager {offer.managerSignedAt ? 'signed' : 'pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {offer.finalStatus !== 'approved' ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Awaiting HR approval. You'll be able to respond once the offer is approved.
                    </p>
                  </div>
                ) : offer.applicantResponse === 'pending' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAccept(offer)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept Offer
                    </button>
                    <button
                      onClick={() => handleReject(offer)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Offer
                    </button>
                  </div>
                ) : offer.applicantResponse === 'accepted' && !offer.candidateSignedAt ? (
                  <button
                    onClick={() => handleSign(offer)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <PenLine className="w-4 h-4" />
                    Sign Offer
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Response Modal */}
        <Modal
          isOpen={isResponseModalOpen}
          onClose={() => {
            setIsResponseModalOpen(false);
            setSelectedOffer(null);
            setResponseNotes('');
          }}
          title="Respond to Offer"
          size="md"
        >
          {selectedOffer && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">{selectedOffer.role}</h4>
                <p className="text-slate-600">Salary: ${selectedOffer.grossSalary.toLocaleString()}/year</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any comments or questions..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => submitResponse('accepted')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Accept Offer'}
                </button>
                <button
                  onClick={() => submitResponse('rejected')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Reject Offer'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Sign Modal */}
        <Modal
          isOpen={isSignModalOpen}
          onClose={() => {
            setIsSignModalOpen(false);
            setSelectedOffer(null);
            setSignerId('');
          }}
          title="Sign Offer"
          size="md"
        >
          {selectedOffer && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">{selectedOffer.role}</h4>
                <p className="text-slate-600">
                  By signing, you confirm your acceptance of this job offer.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your ID *
                </label>
                <input
                  type="text"
                  value={signerId}
                  onChange={(e) => setSignerId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your ID"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will be used as your electronic signature
                </p>
              </div>

              <button
                onClick={submitSignature}
                disabled={submitting || !signerId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                {submitting ? 'Signing...' : 'Sign Offer'}
              </button>
            </div>
          )}
        </Modal>
      </div>
    </RouteGuard>
  );
}
