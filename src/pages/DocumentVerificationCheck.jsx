// DocumentVerificationCheck.jsx
import { useEffect, useState } from "react";
import { apiGet } from "../api.js";
import { Link } from "react-router-dom";

export function useDocumentVerification() {
  const [docStatus, setDocStatus] = useState({
    isLoading: true,
    isVerified: false,
    missingDocs: [],
    error: null
  });

  useEffect(() => {
    checkDocumentStatus();
  }, []);

  const checkDocumentStatus = async () => {
    try {
      const response = await apiGet("/user/documents/status", { withAuth: true });
      
      if (response && response.status === 'verified') {
        setDocStatus({
          isLoading: false,
          isVerified: true,
          missingDocs: [],
          error: null
        });
      } else if (response && response.missingDocs) {
        setDocStatus({
          isLoading: false,
          isVerified: false,
          missingDocs: response.missingDocs,
          error: response.message || "Please upload required documents"
        });
      } else {
        setDocStatus({
          isLoading: false,
          isVerified: false,
          missingDocs: ['driving_license', 'id_proof'],
          error: "Document verification pending"
        });
      }
    } catch (err) {
      setDocStatus({
        isLoading: false,
        isVerified: false,
        missingDocs: [],
        error: err.message || "Failed to fetch document status"
      });
    }
  };

  return { docStatus, refreshDocs: checkDocumentStatus };
}

// Document verification banner component
export function DocumentVerificationBanner({ onRefresh }) {
  const { docStatus, refreshDocs } = useDocumentVerification();

  if (docStatus.isLoading) {
    return (
      <div className="doc-verification-banner loading">
        <div className="spinner-small"></div>
        <span>Checking document verification...</span>
      </div>
    );
  }

  if (docStatus.isVerified) {
    return (
      <div className="doc-verification-banner success">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>✓ Documents verified! You can proceed with booking.</span>
      </div>
    );
  }

  return (
    <div className="doc-verification-banner warning">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
        <circle cx="12" cy="16" r="1" fill="currentColor"/>
      </svg>
      <div className="doc-banner-content">
        <strong>Document Verification Required</strong>
        <p>Please upload the following documents before booking:</p>
        <ul>
          {docStatus.missingDocs.map(doc => (
            <li key={doc}>• {doc.replace('_', ' ').toUpperCase()}</li>
          ))}
        </ul>
        <Link to="/profile/documents" className="doc-upload-link">
          Upload Documents →
        </Link>
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="refresh-docs-btn">
          Refresh Status
        </button>
      )}
    </div>
  );
}