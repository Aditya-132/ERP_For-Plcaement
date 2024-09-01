import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./JobApplicationDetail.css";
import { FaEye, FaEdit, FaSave, FaCheckCircle } from "react-icons/fa";
import Modal from "react-modal";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

const JobApplicationDetail = () => {
  const { reg } = useParams();
  const [jobApplication, setJobApplication] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [editMode, setEditMode] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [emailBody, setEmailBody] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobApplication = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/v1/jobApplication/detail/${reg}`,
          {
            credentials: 'include'
          }
        );
        const data = await response.json();
        setJobApplication(data.jobApplication);
      } catch (error) {
        console.error("Error fetching job application details:", error);
        setError("Failed to load job application details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobApplication();
  }, [reg]);

  const openModal = (url) => {
    if (url) {
      setProofUrl(url);
      setModalIsOpen(true);
    } else {
      setError("No proof document available.");
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setProofUrl("");
  };

  const toggleEditMode = (field) => {
    setEditMode((prevEditMode) => ({
      ...prevEditMode,
      [field]: !prevEditMode[field],
    }));
  };

  const handleInputChange = (e, field) => {
    const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
    setJobApplication({ ...jobApplication, [field]: value });
  };

  const saveChanges = async (field) => {
    try {
      const formData = new FormData();
      if (jobApplication[field] instanceof File) {
        formData.append(field, jobApplication[field]);
      } else {
        formData.append(field, jobApplication[field]);
      }

      const endpoint = `http://localhost:4000/api/v1/jobApplication/update/${jobApplication._id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const updatedApplication = await response.json();
        setJobApplication(updatedApplication.jobApplication);
        setEditMode({});
      } else {
        const errorData = await response.json();
        console.error("Error saving changes:", errorData);
        setError("Failed to save changes.");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      setError("Failed to save changes.");
    }
  };

  const toggleVerification = async (field) => {
    try {
      const isVerified = !jobApplication[field]?.verification?.isVerified;
      const verifiedBy = "Admin"; // This should be dynamically set based on the current user

      const endpoint = `http://localhost:4000/api/v1/jobApplication/update/${jobApplication._id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationUpdates: {
            [field]: {
              isVerified,
              verifiedBy,
            },
          },
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const updatedApplication = await response.json();
        setJobApplication(updatedApplication.jobApplication);
      } else {
        const errorData = await response.json();
        console.error("Error updating verification status:", errorData);
        setError("Failed to update verification status.");
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      setError("Failed to update verification status.");
    }
  };

  const sendCorrectionEmail = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/sendCorrectionEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: jobApplication.email,
          message: emailBody,
        }),
        credentials: 'include'
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        const errorData = await response.json();
        console.error("Error sending correction email:", errorData);
        setError("Failed to send correction email.");
      }
    } catch (error) {
      console.error("Error sending correction email:", error);
      setError("Failed to send correction email.");
    }
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!jobApplication) {
    return <div className="error-message">Error loading job application details.</div>;
  }

  return (
    <>
      <div className="job-application-detail">
        <div className="header">
          <h1>Job Application Detail</h1>
        </div>
        <div className="details-container">
          <section className="detail-card">
            <h2>Personal Information</h2>
            {['fullName', 'email', 'phone', 'dob', 'gender', 'address'].map(field => (
              <div key={field} className="field">
                <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> 
                {editMode[field] ? (
                  field === 'dob' ? (
                    <input
                      type="date"
                      value={jobApplication[field]}
                      onChange={(e) => handleInputChange(e, field)}
                    />
                  ) : field === 'gender' ? (
                    <select
                      value={jobApplication[field]}
                      onChange={(e) => handleInputChange(e, field)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : field === 'address' ? (
                    <textarea
                      value={jobApplication[field]}
                      onChange={(e) => handleInputChange(e, field)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={jobApplication[field]}
                      onChange={(e) => handleInputChange(e, field)}
                    />
                  )
                ) : (
                  <span>{jobApplication[field]}</span>
                )}
                <FaEdit onClick={() => toggleEditMode(field)} className="edit-icon" />
                {editMode[field] && <FaSave onClick={() => saveChanges(field)} className="save-icon" />}
                {jobApplication[field]?.verification && (
                  <>
                    <FaCheckCircle 
                      onClick={() => toggleVerification(field)} 
                      className={`verify-icon ${jobApplication[field].verification.isVerified ? 'verified' : ''}`} 
                    />
                    {jobApplication[field].verification.isVerified && (
                      <span className="verified-by">
                        Verified by {jobApplication[field].verification.verifiedBy}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </section>
          <section className="detail-card">
            <h2>Educational Background</h2>
            {['cgpa', 'ssc', 'hsc', 'gap_year', 'backlogs'].map(field => (
              <div key={field} className="field">
                <strong>{field.toUpperCase()}:</strong> 
                {editMode[field] ? (
                  <input
                    type="text"
                    value={jobApplication[field]}
                    onChange={(e) => handleInputChange(e, field)}
                  />
                ) : (
                  <span>{jobApplication[field]}</span>
                )}
                <FaEdit onClick={() => toggleEditMode(field)} className="edit-icon" />
                {editMode[field] && <FaSave onClick={() => saveChanges(field)} className="save-icon" />}
                {jobApplication[field]?.verification && (
                  <>
                    <FaCheckCircle 
                      onClick={() => toggleVerification(field)} 
                      className={`verify-icon ${jobApplication[field].verification.isVerified ? 'verified' : ''}`} 
                    />
                    {jobApplication[field].verification.isVerified && (
                      <span className="verified-by">
                        Verified by {jobApplication[field].verification.verifiedBy}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
            {['cgpaProof', 'sscProof', 'hscProof', 'internshipProof', 'gap_yearProof', 'profilePhotoProof'].map(field => (
              <div key={field} className="field">
                <strong>{field.replace('Proof', '').toUpperCase()} Proof:</strong> 
                {editMode[field] ? (
                  <>
                    <input type="file" onChange={(e) => handleInputChange(e, field)} />
                    <FaSave onClick={() => saveChanges(field)} className="save-icon" />
                  </>
                ) : (
                  jobApplication[field]?.url && <FaEye className="eye-icon" onClick={() => openModal(jobApplication[field]?.url)} />
                )}
                <FaEdit onClick={() => toggleEditMode(field)} className="edit-icon" />
                {jobApplication[field]?.verification && (
                  <>
                    <FaCheckCircle 
                      onClick={() => toggleVerification(field)} 
                      className={`verify-icon ${jobApplication[field].verification.isVerified ? 'verified' : ''}`} 
                    />
                    {jobApplication[field].verification.isVerified && (
                      <span className="verified-by">
                        Verified by {jobApplication[field].verification.verifiedBy}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </section>
          <section className="detail-card">
            <h2>Professional Experience</h2>
            {['projects', 'internship'].map(field => (
              <div key={field} className="field">
                <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> 
                {editMode[field] ? (
                  <textarea
                    value={jobApplication[field]}
                    onChange={(e) => handleInputChange(e, field)}
                  />
                ) : (
                  <span>{jobApplication[field]}</span>
                )}
                <FaEdit onClick={() => toggleEditMode(field)} className="edit-icon" />
                {editMode[field] && <FaSave onClick={() => saveChanges(field)} className="save-icon" />}
                {jobApplication[field]?.verification && (
                  <>
                    <FaCheckCircle 
                      onClick={() => toggleVerification(field)} 
                      className={`verify-icon ${jobApplication[field].verification.isVerified ? 'verified' : ''}`} 
                    />
                    {jobApplication[field].verification.isVerified && (
                      <span className="verified-by">
                        Verified by {jobApplication[field].verification.verifiedBy}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </section>
          <section className="detail-card">
            <h2>Additional Information</h2>
            {['branch', 'skills', 'references'].map(field => (
              <div key={field} className="field">
                <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> 
                {editMode[field] ? (
                  <textarea
                    value={jobApplication[field]}
                    onChange={(e) => handleInputChange(e, field)}
                  />
                ) : (
                  <span>{jobApplication[field]}</span>
                )}
                <FaEdit onClick={() => toggleEditMode(field)} className="edit-icon" />
                {editMode[field] && <FaSave onClick={() => saveChanges(field)} className="save-icon" />}
                {jobApplication[field]?.verification && (
                  <>
                    <FaCheckCircle 
                      onClick={() => toggleVerification(field)} 
                      className={`verify-icon ${jobApplication[field].verification.isVerified ? 'verified' : ''}`} 
                    />
                    {jobApplication[field].verification.isVerified && (
                      <span className="verified-by">
                        Verified by {jobApplication[field].verification.verifiedBy}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </section>
          <section className="detail-card">
            <h2>Send Correction Email</h2>
            <div className="field">
              <strong>Email Body:</strong>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows="5"
                cols="50"
              />
            </div>
            <button onClick={sendCorrectionEmail} className="send-email-button">Send Correction Email</button>
            {emailSent && <p>Email sent successfully.</p>}
          </section>
          <section className="detail-card">
            <h2>Correction message</h2>
            <div className="field">
              <textarea
                value={jobApplication.message}
                onChange={(e) => handleInputChange(e, 'message')}
                rows="5"
                cols="50"
              />
            </div>
            <button onClick={() => saveChanges('message')} className="send-email-button">Leave Correction Message</button>
          </section>
        </div>
      </div>
      <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Proof Modal"
          style={{
            content: {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              height: "80%",
            },
          }}
        >
          <button onClick={closeModal} className="close-modal-button">
            Close
          </button>
          <div className="proof-content">
            {proofUrl.endsWith(".pdf") ? (
              <iframe
                src={proofUrl}
                title="Proof Document"
                style={{ width: "100%", height: "100%" }}
              ></iframe>
            ) : (
              <img src={proofUrl} alt="Proof Document" style={{ width: "100%" }} />
            )}
            <div>
              <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                Open Document
              </a>
            </div>
          </div>
        </Modal>
    </>
  );
};

export default JobApplicationDetail;
