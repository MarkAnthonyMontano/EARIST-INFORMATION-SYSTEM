import React, { useState, useEffect } from "react";
import "../styles/TempStyles.css";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Avatar,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EventIcon from "@mui/icons-material/Event";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

const ApplicantDashboard = () => {
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [applicantID, setApplicantID] = useState("");
  const [person, setPerson] = useState({
    profile_img: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    extension: "",
    profile_image: "",
  });
  const [proctor, setProctor] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);

      if (storedRole === "applicant") {
        fetchPersonData(storedID);
        fetchApplicantNumber(storedID);
      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const [medicalUploads, setMedicalUploads] = useState([]);

  const fetchMedicalUploads = async (personId) => {
    try {
      const res = await axios.get(`http://localhost:5000/uploads`, {
        headers: { "x-person-id": personId },
      });

      // ✅ Only get vaccine/medical related uploads
      const medicalDocs = res.data.filter(u =>
        u.original_name?.toLowerCase().includes("vaccine") ||
        u.description?.toLowerCase().includes("vaccine") ||
        u.requirements_id === 5 // if 5 = VaccineCard in your DB
      );

      setMedicalUploads(medicalDocs);
    } catch (err) {
      console.error("❌ Failed to fetch medical uploads:", err);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("person_id");
    if (id) {
      checkRequirements(id);
      fetchMedicalUploads(id); // 👈 fetch medical documents
    }
  }, []);

  // add these alongside your other useState declarations
  const [qualifyingExamScore, setQualifyingExamScore] = useState(null);
  const [qualifyingInterviewScore, setQualifyingInterviewScore] = useState(null);
  const [examScore, setExamScore] = useState(null);


  const fetchProctorSchedule = async (applicantNumber) => {
    if (!applicantNumber) return console.warn("fetchProctorSchedule missing applicantNumber");
    try {
      const { data } = await axios.get(`http://localhost:5000/api/applicant-schedule/${applicantNumber}`);
      console.info("applicant-schedule response for", applicantNumber, data);
      setProctor(data);
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setProctor(null);
    }
  };


  const [requirementsCompleted, setRequirementsCompleted] = useState(
    localStorage.getItem("requirementsCompleted") === "1"
  );

  useEffect(() => {
    const checkRequirements = () => {
      setRequirementsCompleted(localStorage.getItem("requirementsCompleted") === "1");
    };

    // Run on mount
    checkRequirements();

    // Optional: Listen for storage changes across tabs/components
    window.addEventListener("storage", checkRequirements);

    return () => window.removeEventListener("storage", checkRequirements);
  }, []);

  const [allRequirementsCompleted, setAllRequirementsCompleted] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("person_id");
    if (id) {
      checkRequirements(id);
    }
  }, []);

  const checkRequirements = async (personId) => {
    try {
      const res = await axios.get("http://localhost:5000/uploads", {
        headers: { "x-person-id": personId },
      });

      const uploadsData = res.data;
      const rebuiltSelectedFiles = {};

      uploadsData.forEach((upload) => {
        const desc = upload.description.toLowerCase();
        if (desc.includes("form 138")) rebuiltSelectedFiles["Form138"] = true;
        if (desc.includes("good moral")) rebuiltSelectedFiles["GoodMoralCharacter"] = true;
        if (desc.includes("birth certificate")) rebuiltSelectedFiles["BirthCertificate"] = true;
        if (desc.includes("graduating class")) rebuiltSelectedFiles["CertificateOfGraduatingClass"] = true;
        if (desc.includes("vaccine card")) rebuiltSelectedFiles["VaccineCard"] = true;
      });

      const allRequired = ["Form138", "GoodMoralCharacter", "BirthCertificate", "CertificateOfGraduatingClass", "VaccineCard"]
        .every((key) => rebuiltSelectedFiles[key]);

      setAllRequirementsCompleted(allRequired);
      localStorage.setItem("requirementsCompleted", allRequired ? "1" : "0");
    } catch (err) {
      console.error("Failed to check requirements:", err);
    }
  };




  const fetchApplicantNumber = async (personID) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/applicant_number/${personID}`
      );
      if (res.data && res.data.applicant_number) {
        setApplicantID(res.data.applicant_number);
        fetchEntranceExamScores(res.data.applicant_number);
        fetchProctorSchedule(res.data.applicant_number);
        fetchInterviewSchedule(res.data.applicant_number);
      }
    } catch (error) {
      console.error("Failed to fetch applicant number:", error);
    }
  };

  const fetchPersonData = async (id) => {
    if (!id) return console.warn("fetchPersonData called with empty id");

    try {
      console.info("fetchPersonData -> requesting person_with_applicant for id:", id);
      const res = await axios.get(`http://localhost:5000/api/person_with_applicant/${id}`);
      console.info("person_with_applicant response:", res.data);
      setPerson(res.data || {});

      const applicantNumber = res.data?.applicant_number ?? res.data?.applicantNumber ?? null;
      if (applicantNumber) {
        setApplicantID(applicantNumber);
        try {
          const sched = await axios.get(`http://localhost:5000/api/applicant-schedule/${applicantNumber}`);
          console.info("applicant-schedule:", sched.data);
          setProctor(sched.data);
        } catch (e) {
          console.warn("applicant-schedule fetch failed:", e?.response?.data || e.message);
          setProctor(null);
        }
      } else {
        console.warn("No applicant_number in person_with_applicant response for id", id);
      }

      // map many possible field names
      let qExam = res.data?.qualifying_exam_score ?? res.data?.qualifying_result ?? res.data?.exam_score ?? null;
      let qInterview = res.data?.qualifying_interview_score ?? res.data?.interview_result ?? null;
      let ex = res.data?.exam_score ?? res.data?.exam_result ?? null;


      // fallback: fetch person_status_by_applicant if scores not present
      if ((qExam === null && qInterview === null && ex === null) && applicantNumber) {
        try {
          const st = await axios.get(`http://localhost:5000/api/person_status_by_applicant/${applicantNumber}`);
          console.info("person_status_by_applicant response:", st.data);
          qExam = qExam ?? st.data?.qualifying_result ?? null;
          qInterview = qInterview ?? st.data?.interview_result ?? null;
          ex = ex ?? st.data?.exam_result ?? null;
        } catch (err) {
          console.warn("Fallback status endpoint failed:", err?.response?.data || err.message);
        }
      }

      setQualifyingExamScore(qExam !== undefined ? qExam : null);
      setQualifyingInterviewScore(qInterview !== undefined ? qInterview : null);
      setExamScore(ex !== undefined ? ex : null);


      console.info("final mapped scores:", { qExam, qInterview, ex });

    } catch (err) {
      console.error("fetchPersonData failed:", err?.response?.data || err.message);
    }
  };



  // Format start and end time
  const formatTime = (time) =>
    time
      ? new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      : "";

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const [examScores, setExamScores] = useState({
    english: null,
    science: null,
    filipino: null,
    math: null,
    abstract: null,
    final: null
  });

  const fetchEntranceExamScores = async (applicantNumber) => {
    if (!applicantNumber) return;
    try {
      const res = await axios.get("http://localhost:5000/api/applicants-with-number");
      const applicant = res.data.find(a => a.applicant_number === applicantNumber);

      if (applicant) {
        const english = Number(applicant.english) || 0;
        const science = Number(applicant.science) || 0;
        const filipino = Number(applicant.filipino) || 0;
        const math = Number(applicant.math) || 0;
        const abstract = Number(applicant.abstract) || 0;
        const finalRating = applicant.final_rating
          ? Number(applicant.final_rating)
          : (english + science + filipino + math + abstract) / 5;

        setExamScores({
          english,
          science,
          filipino,
          math,
          abstract,
          final: finalRating.toFixed(2)
        });
      } else {
        setExamScores({
          english: null,
          science: null,
          filipino: null,
          math: null,
          abstract: null,
          final: null
        });
      }
    } catch (err) {
      console.error("❌ Failed to fetch entrance exam scores:", err);
    }
  };


  const hasScores = examScores.english !== null &&
    examScores.science !== null &&
    examScores.filipino !== null &&
    examScores.math !== null &&
    examScores.abstract !== null &&
    (
      examScores.english > 0 ||
      examScores.science > 0 ||
      examScores.filipino > 0 ||
      examScores.math > 0 ||
      examScores.abstract > 0
    );

  const hasSchedule = proctor?.email_sent === 1;

  const [interviewSchedule, setInterviewSchedule] = useState(null);
  const [hasInterviewScores, setHasInterviewScores] = useState(false);

  const fetchInterviewSchedule = async (applicantNumber) => {
    if (!applicantNumber) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/applicant-interview-schedule/${applicantNumber}`
      );
      console.info("Interview schedule:", res.data);
      setInterviewSchedule(res.data);

      // detect if they already have interview/qualifying scores
      if (
        qualifyingExamScore !== null ||
        qualifyingInterviewScore !== null ||
        examScore !== null
      ) {
        setHasInterviewScores(true);
      } else {
        setHasInterviewScores(false);
      }
    } catch (err) {
      console.error("❌ Failed to fetch interview schedule:", err);
      setInterviewSchedule(null);
    }
  };



  return (
    <Box
      sx={{
        p: 4,
        marginLeft: "-2rem",
        paddingRight: 8,
        height: "calc(100vh - 150px)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Applicant Dashboard
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ marginBottom: "1rem" }}
        gutterBottom
      >
        Date: {formattedDate}
      </Typography>

      <Grid container spacing={3}>
        {/* Applicant Information */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              marginLeft: "10px",
              p: 2,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                {!person?.profile_image ? (
                  <PersonIcon sx={{ color: "maroon" }} fontSize="large" />
                ) : (
                  <Avatar
                    src={`http://localhost:5000/uploads/${person.profile_image}`}
                    sx={{ width: 50, height: 50 }}
                  />
                )}
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {person.last_name?.toUpperCase()}, {person.first_name}{" "}
                    {person.middle_name} {person.extension}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Applicant ID: {applicantID || "N/A"}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Application Status
              </Typography>
              <Typography style={{ color: "maroon", fontWeight: "bold" }} >
                {allRequirementsCompleted
                  ? "Your application is registered."
                  : "Please complete all required documents to register your application."}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              marginLeft: "10px",
              boxShadow: 3,
              p: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                Application Form
              </Typography>
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: "maroon",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
                onClick={() => {
                  // 🔑 generate random keys if not already set
                  if (!localStorage.getItem("dashboardKeys")) {
                    const generateKey = () =>
                      Math.random().toString(36).substring(2, 10);

                    const dashboardKeys = {
                      step1: generateKey(),
                      step2: generateKey(),
                      step3: generateKey(),
                      step4: generateKey(),
                      step5: generateKey(),
                    };

                    localStorage.setItem(
                      "dashboardKeys",
                      JSON.stringify(dashboardKeys)
                    );
                  }

                  const keys = JSON.parse(localStorage.getItem("dashboardKeys"));
                  window.location.href = `/dashboard/${keys.step1}`;
                }}
              >
                Start Application
              </button>
            </CardContent>
          </Card>
        </Grid>



        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              marginLeft: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <DescriptionIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Document Submitted
              </Typography>

              {person?.document_status === "Documents Verified & ECAT" ? (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "green", textAlign: "left" }}
                >
                  ✅ Your documents have been verified. <br />
                  ECAT Examination Permit has been issued.
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "gray" }}
                >
                  Status: Pending
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>


        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <AssignmentTurnedInIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Admission / Entrance Exam
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Check schedule and results of your exam.
              </Typography>


              {/* ✅ PHASE 1: Pending (no schedule, no scores) */}
              {!hasSchedule && !hasScores && (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "gray" }}
                >
                  ⏳ Status: Pending
                </Typography>
              )}

              {/* ✅ PHASE 2: Scheduled (schedule present, no scores) */}
              {hasSchedule && !hasScores && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    👨‍🏫 Proctor: {proctor?.proctor || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    📅 Date: {proctor?.day_description || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🏫 Building: {proctor?.building_description || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🏷️ Room No: {proctor?.room_description || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    ⏰ Time: {formatTime(proctor?.start_time)} – {formatTime(proctor?.end_time)}
                  </Typography>
                </>
              )}

              {/* ✅ PHASE 3: Released (scores present, hide schedule) */}
              {hasScores && (
                <Box sx={{ mt: 1, textAlign: "left" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "maroon" }}>
                    Entrance Exam Score:
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    📝 English: {examScores.english}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🔬 Science: {examScores.science}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    📖 Filipino: {examScores.filipino}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    ➗ Math: {examScores.math}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🧠 Abstract: {examScores.abstract}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "green" }}>
                    ⭐ Final Rating: {examScores.final}
                  </Typography>
                </Box>
              )}


            </CardContent>
          </Card>
        </Grid>


        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <EventIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Interview Schedule / Qualifying Exam
              </Typography>

              {/* ✅ Phase 1: Pending */}
              {!interviewSchedule && !hasInterviewScores && (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "gray" }}
                >
                  ⏳ Status: Pending
                </Typography>
              )}

              {/* ✅ Phase 2: Scheduled (show schedule if no scores yet) */}
              {interviewSchedule && !hasInterviewScores && (
                <Box sx={{ mt: 1, textAlign: "left" }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    👤 Interviewer: {interviewSchedule.interviewer || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    📅 Date: {interviewSchedule.day_description || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🏫 Building: {interviewSchedule.building_description || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🏷️ Room: {interviewSchedule.room_description || "TBA"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    ⏰ Time: {formatTime(interviewSchedule.start_time)} – {formatTime(interviewSchedule.end_time)}
                  </Typography>
                </Box>
              )}

              {/* ✅ Phase 3: Released (show scores if present, hide schedule) */}
              {hasInterviewScores && (
                <Box sx={{ mt: 2, textAlign: "left" }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    🗣 Interview Score: {qualifyingInterviewScore ?? "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    📝 Qualifying Exam Score: {qualifyingExamScore ?? "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                    📊 Exam Result: {examScore ?? "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "green" }}>
                    📈 Total Average: {(
                      (Number(qualifyingExamScore ?? 0) +
                        Number(qualifyingInterviewScore ?? 0) +
                        Number(examScore ?? 0)) / 3
                    ).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </CardContent>

          </Card>
        </Grid>


        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              marginLeft: "10px",
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <CheckCircleIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                College Approval
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                Status: Application is on process
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "maroon" }}>
                College Approval Score:
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <LocalHospitalIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Medical Submitted
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                Status: Application is on process
              </Typography>

              {medicalUploads.length === 0 ? (
                <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                  Status: Pending
                </Typography>
              ) : (
                medicalUploads.map((doc) => (
                  <Box key={doc.upload_id} sx={{ mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        color:
                          doc.status === 1 ? "green" : doc.status === 2 ? "red" : "gray",
                      }}
                    >
                      {doc.status === 1
                        ? "✅ Documents Verified"
                        : doc.status === 2
                          ? "❌ Rejected"
                          : doc.document_status === "Documents Verified "
                            ? "✅ Documents Verified "
                            : ""}

                    </Typography>
                    {doc.remarks && (
                      <Typography variant="body2" sx={{ color: "maroon" }}>
                        Remarks: {doc.remarks}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>


        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              minHeight: 220,
              marginLeft: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <PersonIcon sx={{ color: "maroon" }} fontSize="large" />
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Applicant Status
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold", color: "gray" }}>
                Status: Application is on process
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Announcement */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              marginLeft: "10px",
              boxShadow: 3,
              p: 2,
              minHeight: 220, // 🔹 make them consistent height
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)", // 🔹 zoom effect
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Typography sx={{ textAlign: "center" }} variant="h6" gutterBottom>
                Announcement
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Stay tuned for updates on admission results, schedules, and
                other important notices.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApplicantDashboard;
