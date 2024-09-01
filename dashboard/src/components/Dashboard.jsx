import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate, Link, Route, Routes } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { GoCheckCircleFill } from "react-icons/go";
import { AiFillCloseCircle } from "react-icons/ai";
import Modal from "react-modal";
import JobApplicationDetail from "./JobApplicationDetail";
import "./Dashboard.css";
import Papa from "papaparse"; // Import the CSS file for styling

Modal.setAppElement("#root");

const Dashboard = () => {
  const [jobApplications, setJobApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [filters, setFilters] = useState({
    cgpa: "",
    hsc: "",
    ssc: "",
    gap_year: "",
    branch: "",
  });

  useEffect(() => {
    const fetchJobApplications = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/jobApplication/getall",
          { withCredentials: true }
        );
        console.log(data);
        setJobApplications(data.jobApplications);
        setFilteredApplications(data.jobApplications);
      } catch (error) {
        setJobApplications([]);
        setFilteredApplications([]);
      }
    };
    fetchJobApplications();
  }, []);

  const handleUpdateStatus = async (jobApplicationId, field, value) => {
    try {
      const { data } = await axios.put(
        `http://localhost:4000/api/v1/jobApplication/update/${jobApplicationId}`,
        { [field]: value },
        { withCredentials: true }
      );
      setJobApplications((prevJobApplications) =>
        prevJobApplications.map((jobApplication) =>
          jobApplication._id === jobApplicationId
            ? { ...jobApplication, [field]: value }
            : jobApplication
        )
      );
      setFilteredApplications((prevFilteredApplications) =>
        prevFilteredApplications.map((jobApplication) =>
          jobApplication._id === jobApplicationId
            ? { ...jobApplication, [field]: value }
            : jobApplication
        )
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const openModal = (url) => {
    setProofUrl(url);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setProofUrl("");
  };

  const handleInputChange = (jobApplicationId, field, value) => {
    setJobApplications((prevJobApplications) =>
      prevJobApplications.map((jobApplication) =>
        jobApplication._id === jobApplicationId
          ? { ...jobApplication, [field]: value }
          : jobApplication
      )
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  useEffect(() => {
    const filtered = jobApplications.filter((application) => {
      return (
        (filters.cgpa === "" || application.cgpa >= parseFloat(filters.cgpa)) &&
        (filters.hsc === "" || application.hsc >= parseFloat(filters.hsc)) &&
        (filters.ssc === "" || application.ssc >= parseFloat(filters.ssc)) &&
        (filters.gap_year === "" ||
          (application.gap_year && application.gap_year <= parseInt(filters.gap_year))) &&
        (filters.branch === "" || application.branch === filters.branch)
      );
    });
    setFilteredApplications(filtered);
  }, [filters, jobApplications]);

  const { isAuthenticated, admin } = useContext(Context);
  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  const handleDownloadCSV = () => {
    const csvData = filteredApplications.map((application) => ({
      "Full Name": application.fullName,
      "Registration Number": application.reg,
      CGPA: application.cgpa,
      "HSC Marks": application.hsc,
      "SSC Marks": application.ssc,
      Department: application.branch,
      Status: application.status,
      Placed: application.placed,
      Package: application.amount,
      Email: application.email,
    }));

    const csv = Papa.unparse(csvData);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "job_applications.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
 
  

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <section className="dashboard page">
            

              {/* Filter Section */}
              <div className="filter-section">
                <h5>Filter Student Applications</h5>
                <div className="filters">
                  <input
                    type="number"
                    name="cgpa"
                    placeholder="Min CGPA"
                    value={filters.cgpa}
                    onChange={handleFilterChange}
                  />
                  <input
                    type="number"
                    name="hsc"
                    placeholder="Min HSC Marks"
                    value={filters.hsc}
                    onChange={handleFilterChange}
                  />
                  <input
                    type="number"
                    name="ssc"
                    placeholder="Min SSC Marks"
                    value={filters.ssc}
                    onChange={handleFilterChange}
                  />
                  <input
                    type="number"
                    name="gap_year"
                    placeholder="Max Gap Year"
                    value={filters.gap_year}
                    onChange={handleFilterChange}
                  />
                   <input
                    
                    name="branch"
                    placeholder="branch"
                    value={filters.branch}
                    onChange={handleFilterChange}
                  />
                <button className="csv-button" onClick={handleDownloadCSV}>
                Download CSV
              </button>
                </div>
              </div>

              <div className="banner">
                <h5>Student Applications</h5>
                <div className="table-container">
  <table className="styled-table">
    <thead>
      <tr>
        <th>Full Name</th>
        <th>Registration Number</th>
        <th>CGPA</th>
        <th>HSC Marks</th>
        <th>SSC Marks</th>
        <th>Department</th>
        <th>Status</th>
        <th>Placed</th>
        <th>Package</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredApplications.length > 0
        ? filteredApplications.map((application) => (
            <tr key={application._id}>
              <td>{application.fullName}</td>
              <td>
                <Link to={`/job-application/${application.reg}`}>
                  {application.reg}
                </Link>
              </td>
              <td>{application.cgpa}</td>
              <td>{application.hsc}</td>
              <td>{application.ssc}</td>
              <td>{application.branch}</td>
              <td>
                <select
                  className={
                    application.status === "Pending"
                      ? "value-pending"
                      : application.status === "Accepted"
                      ? "value-accepted"
                      : "value-rejected"
                  }
                  value={application.status}
                  onChange={(e) =>
                    handleUpdateStatus(application._id, "status", e.target.value)
                  }
                >
                  <option value="Pending" className="value-pending">
                    Pending
                  </option>
                  <option value="Accepted" className="value-accepted">
                    Accepted
                  </option>
                  <option value="Rejected" className="value-rejected">
                    Rejected
                  </option>
                </select>
              </td>
              <td>
                <select
                  value={application.placed}
                  onChange={(e) =>
                    handleUpdateStatus(application._id, "placed", e.target.value)
                  }
                >
                  <option value="Placed">Placed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={application.amount}
                  onChange={(e) =>
                    handleInputChange(application._id, "amount", e.target.value)
                  }
                  onBlur={(e) =>
                    handleUpdateStatus(application._id, "amount", e.target.value)
                  }
                />
              </td>
              <td>
                {application.status === "Accepted" ? (
                  <GoCheckCircleFill className="green" />
                ) : (
                  <AiFillCloseCircle className="red" />
                )}
              </td>
            </tr>
          ))
        : null}
    </tbody>
  </table>
</div>

              </div>
            </section>
          }
        />
        <Route path="/job-application/:reg" element={<JobApplicationDetail />} />
      </Routes>
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Proof Modal" className="modal-content">
  <img src={proofUrl} alt="Proof Document" />
  <button onClick={closeModal}>Close</button>
</Modal>

    </>
  );
};

export default Dashboard;
