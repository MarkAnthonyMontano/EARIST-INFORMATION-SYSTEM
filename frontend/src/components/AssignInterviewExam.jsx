import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, Grid, MenuItem, TextField, Typography, Paper } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";


import { useNavigate } from "react-router-dom";

const AssignInterviewExam = () => {
    const tabs = [
        { label: "Interview Room Assignment", to: "/assign_interview_exam" },
        { label: "Interview Schedule Management", to: "/assign_schedule_applicants_interview" },
        { label: "Interviewer Applicant's List", to: "/interviewer_applicant_list" },
    ];


    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(1);
    const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));


    const handleStepClick = (index, to) => {
        setActiveStep(index);
        navigate(to); // this will actually change the page
    };

    const [day, setDay] = useState("");
    const [roomId, setRoomId] = useState("");            // store selected room_id
    const [rooms, setRooms] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [message, setMessage] = useState("");
    const [roomQuota, setRoomQuota] = useState("");
    const [interviewer, setInterviewer] = useState("");
    const [roomNo, setRoomNo] = useState("");
    const [roomName, setRoomName] = useState("");
    const [buildingName, setBuildingName] = useState("");




    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await axios.get("http://localhost:5000/room_list");
                // expect res.data = [{ room_id: 1, room_description: "Room A" }, ...]
                setRooms(res.data);
            } catch (err) {
                console.error("Error fetching rooms:", err);
                setMessage("Could not load rooms. Check backend /room_list.");
            }
        };
        fetchRooms();
    }, []);

    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const res = await axios.get("http://localhost:5000/interview_schedules_with_count");

                setSchedules(res.data);
            } catch (err) {
                console.error("Error fetching schedules:", err);
            }
        };
        fetchSchedules();
    }, []);

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        setMessage("");

        const sel = rooms.find((r) => String(r.room_id) === String(roomId));
        if (!sel) {
            setMessage("Please select a valid building and room.");
            return;
        }

        try {
            await axios.post("http://localhost:5000/insert_interview_schedule", {
                day_description: day,
                building_description: sel.building_description,
                room_description: sel.room_description,
                start_time: startTime,
                end_time: endTime,
                interviewer,
                room_quota: roomQuota || 40,
            });

            // ✅ Success
            setMessage("Interview schedule saved successfully ✅");
            setDay("");
            setRoomId("");
            setStartTime("");
            setEndTime("");
            setInterviewer("");
            setRoomQuota("");

            // 🔄 Refresh schedules
            const res = await axios.get("http://localhost:5000/interview_schedules_with_count");
            setSchedules(res.data);

        } catch (err) {
            console.error("Error saving schedule:", err);

            if (err.response && err.response.data && err.response.data.error) {
                // ✅ Display backend-provided error (like conflict)
                setMessage(err.response.data.error);
            } else {
                setMessage("Failed to save schedule ❌");
            }
        }
    };



    return (
        <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent" }}>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    mt: 2,
                    mb: 2,
                    px: 2,
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                        color: 'maroon',
                        fontSize: '36px',
                    }}
                >
                    INTERVIEW ROOM ASSIGNMENT
                </Typography>


            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />

            <br />


            <Box display="flex" sx={{ border: "2px solid maroon", borderRadius: "4px", overflow: "hidden" }}>
                {tabs.map((tab, index) => {
                    const isActive = location.pathname === tab.to;

                    return (
                        <Link
                            key={index}
                            to={tab.to}
                            style={{ textDecoration: "none", flex: 1 }}
                        >
                            <Box
                                sx={{
                                    backgroundColor: isActive ? "#6D2323" : "#E8C999",  // ✅ active vs default
                                    padding: "16px",
                                    color: isActive ? "#ffffff" : "#000000",            // ✅ text color contrast
                                    textAlign: "center",
                                    height: "75px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    borderRight: index !== tabs.length - 1 ? "2px solid white" : "none",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        backgroundColor: isActive ? "#6D2323" : "#f9f9f9",
                                        color: isActive ? "#ffffff" : "#6D2323",
                                    },
                                }}
                            >
                                <Typography sx={{ color: "inherit", fontWeight: "bold", wordBreak: "break-word" }}>
                                    {tab.label}
                                </Typography>
                            </Box>
                        </Link>
                    );
                })}
            </Box>

            <Box
                display="flex"
                justifyContent="center"
                alignItems="flex-start"
                width="100%"
                mt={3}
            >
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        maxWidth: 500,
                        width: "100%",
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        border: "3px solid maroon", // keep the maroon border
                    }}
                >
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        mb={2}
                        textAlign="center"
                        color="maroon"
                    >
                        ADD SCHEDULE
                    </Typography>

                    <form onSubmit={handleSaveSchedule}>
                        <Grid container spacing={1}>
                            {/* Day */}
                            <Grid item xs={12}>
                                <Typography fontWeight={500}>Exam Date:</Typography>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        value={day ? dayjs(day) : null}
                                        onChange={(newValue) => {
                                            // Save as MM/DD/YYYY for backend
                                            const formatted = newValue ? dayjs(newValue).format("MM/DD/YYYY") : "";
                                            setDay(formatted);
                                        }}
                                        slotProps={{ textField: { fullWidth: true, required: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            {/* Building */}
                            <Grid item xs={12}>
                                <Typography fontWeight={500}>Building:</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    label="Select Building"
                                    variant="outlined"
                                    value={buildingName}
                                    onChange={(e) => setBuildingName(e.target.value)}
                                
                                >
                                    {[...new Set(
                                        rooms
                                            .map(r => r.building_description)
                                            .filter(b => b && b.trim() !== "") // ✅ remove NULL and empty strings
                                    )].map((b, i) => (
                                        <MenuItem key={i} value={b}>{b}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>


                            {/* Room */}
                            <Grid item xs={12}>
                                <Typography fontWeight={500}>Room:</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    label="Select Room"
                                    variant="outlined"
                                    value={roomId}                 // ✅ bind to roomId (not roomName)
                                    onChange={(e) => setRoomId(e.target.value)} // ✅ update roomId
                                   
                                >
                                    {rooms
                                        .filter(r => r.building_description === buildingName || !buildingName)
                                        .map(room => (
                                            <MenuItem key={room.room_id} value={room.room_id}>
                                                {room.room_description}
                                            </MenuItem>
                                        ))}
                                </TextField>
                            </Grid>





                            {/* Start Time */}
                            <Grid item xs={12}>
                                <Typography fontWeight={500}>Start Time:</Typography>
                                <TextField
                                    fullWidth
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    inputProps={{ step: 300 }} // 5-min step
                                    required
                                    variant="outlined"
                                />
                            </Grid>

                            {/* End Time */}
                            <Grid item xs={12}>
                                <Typography fontWeight={500}>End Time:</Typography>
                                <TextField
                                    fullWidth
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    inputProps={{ step: 300 }}
                                    required
                                    variant="outlined"
                                />
                            </Grid>


                            {/* Interviewer */}
                            <Grid item xs={12}>
                                <Typography fontWeight={500}>
                                    Interviewer:
                                </Typography>
                                <TextField
                                    fullWidth
                                    value={interviewer}
                                    onChange={(e) => setInterviewer(e.target.value)}
                                    required
                                    variant="outlined"
                                    placeholder="Enter Interviewer Name"
                                />
                            </Grid>

                            {/* Room Quota */}
                            <Grid item xs={12}>
                                <Typography fontWeight={500}>Room Quota</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={roomQuota}
                                    onChange={(e) => setRoomQuota(e.target.value)}
                                    required
                                    variant="outlined"
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>


                            {/* Submit Button */}
                            <Grid item xs={12} display="flex" justifyContent="center">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{
                                        bgcolor: "#800000",
                                        "&:hover": { bgcolor: "#a00000" },
                                        px: 6,
                                        py: 1.5,
                                        mt: 2,
                                        borderRadius: 2,
                                    }}
                                >
                                    Save Schedule
                                </Button>
                            </Grid>

                            {/* Message */}
                            {message && (
                                <Grid item xs={12}>
                                    <Typography textAlign="center" color="maroon">
                                        {message}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </form>
                </Paper>
            </Box>
        </Box>
    );
};

export default AssignInterviewExam;
