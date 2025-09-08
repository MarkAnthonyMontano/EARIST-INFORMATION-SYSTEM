import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Typography, Box, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";

const ScheduleChecker = () => {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedRoom2, setSelectedRoom2] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("")
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [schoolYearList, setSchoolYearList] = useState([]);
  const [profList, setProfList] = useState([]);
  const [dayList, setDayList] = useState([]);
  const [sectionList, setSectionList] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { dprtmnt_id } = useParams();

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/room_list/${dprtmnt_id}`);
      setRoomList(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  const fetchCourseList = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/course_list`);
      setCourseList(response.data)
    } catch (error) {
      console.log(error);
    }
  }

  const fetchSchoolYearList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_active_school_years');
      setSchoolYearList(response.data)
    } catch (error) {
      console.log(error);
    }
  }

  const fetchProfList = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/prof_list/${dprtmnt_id}`);
      setProfList(res.data);
    } catch (err) {
      console.error("Error fetching professors:", err);
    }
  }

  const fetchDayList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schedule-plotting/day_list');
      setDayList(response.data)
    } catch (error) {
      console.log(error);
    }
  }

  const fetchSectionList = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/section_table/${dprtmnt_id}`);
      console.log("Section List Response:", response.data);
      setSectionList(response.data)
    } catch (error) {
      console.log(error);
    }
  }

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/get/all_schedule/${selectedRoom2}`);
      setSchedule(response.data)
    } catch (error) {
      console.error("Error fetching schedule:", error);

      if (error.response && error.response.status === 404) {
        setMessage("Schedule not found in selected program and room. Please assign a schedule.");
      } else {
        setMessage("Failed to fetch schedule. Please try again later.");
      }

      setSchedule([]);
      setOpenSnackbar(true);
    }
  }

  const formatTimeTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${suffix}`;
  };

  useEffect(() => {
    fetchRoom();
    fetchCourseList();
    fetchSchoolYearList();
    fetchProfList();
    fetchDayList();
    fetchSectionList();
  }, []);

  useEffect(() => {
    if (roomList.length > 0 && !selectedRoom2) {
      setSelectedRoom2(roomList[0].room_id);
    }
  }, [roomList]);

  useEffect(() => {
    if (selectedRoom2) {
      fetchSchedule();
    }
  }, [selectedRoom2]);

  useEffect(() => {
    if (schoolYearList.length > 0) {
      setSelectedSchoolYear(schoolYearList[0].id);
    }
  }, [schoolYearList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const subjectResponse = await axios.post("http://localhost:5000/api/check-subject", {
        section_id: selectedSection,
        school_year_id: selectedSchoolYear,
        prof_id: selectedProf,
        subject_id: selectedSubject,
      });

      if (subjectResponse.data.exists) {
        setMessage("This professor is already assigned to this subject in this section and school year.");
        setOpenSnackbar(true);
        return;
      }

      const timeResponse = await axios.post("http://localhost:5000/api/check-conflict", {
        day: selectedDay,
        start_time: selectedStartTime,
        end_time: selectedEndTime,
        section_id: selectedSection,
        school_year_id: selectedSchoolYear,
        prof_id: selectedProf,
        room_id: selectedRoom,
        subject_id: selectedSubject,
      });

      if (timeResponse.data.conflict) {
        setMessage("Schedule conflict detected! Please choose a different time.");
        setOpenSnackbar(true);
      } else {
        setMessage("Schedule is available. You can proceed with adding it.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("Error checking schedule:", error);
      setMessage("Schedule conflict detected! Please choose a different time.");
      setOpenSnackbar(true);
    }
  };

  const handleInsert = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formattedStartTime = formatTimeTo12Hour(selectedStartTime);
      const formattedEndTime = formatTimeTo12Hour(selectedEndTime);

      const response = await axios.post("http://localhost:5000/api/insert-schedule", {
        day: selectedDay,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        section_id: selectedSection,
        school_year_id: selectedSchoolYear,
        prof_id: selectedProf,
        room_id: selectedRoom,
        subject_id: selectedSubject,
      });

      if (response.status === 200) {
        setMessage("Schedule inserted successfully.");
        setOpenSnackbar(true);
      }

      setSelectedDay("")
      setSelectedSection("")
      setSelectedRoom("")
      setSelectedSubject("")
      setSelectedProf("")
      setSelectedSchoolYear("")
      setSelectedStartTime("")
      setSelectedEndTime("")
      fetchSchedule()

    } catch (error) {
      console.error("Error inserting schedule:", error);
      setMessage("Failed to insert schedule.");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  const isTimeInSchedule = (start, end, day) => {
    const parseTime = (timeStr) => {
      // Converts "5:00 PM" into a Date object
      return new Date(`1970-01-01 ${timeStr}`);
    };
  
    return schedule.some(entry => {
      if (entry.day_description !== day) return false;
  
      const slotStart = parseTime(start);
      const slotEnd = parseTime(end);
      const schedStart = parseTime(entry.school_time_start);
      const schedEnd = parseTime(entry.school_time_end);
  
      return slotStart >= schedStart && slotEnd <= schedEnd;
    });
  };
  
  const hasAdjacentSchedule = (start, end, day, direction = "top") => {
    const parseTime = (timeStr) => new Date(`1970-01-01 ${timeStr}`);
  
    const minutesOffset = direction === "top" ? -60 : 60;
  
    const newStart = new Date(parseTime(start).getTime() + minutesOffset * 60000);
    const newEnd   = new Date(parseTime(end).getTime() + minutesOffset * 60000);
  
    const currentEntry = schedule.find(entry => {
      if (entry.day_description !== day) return false;
  
      const schedStart = parseTime(entry.school_time_start);
      const schedEnd   = parseTime(entry.school_time_end);
  
      return parseTime(start) >= schedStart && parseTime(end) <= schedEnd;
    });
  
    const adjacentEntry = schedule.find(entry => {
      if (entry.day_description !== day) return false;
  
      const schedStart = parseTime(entry.school_time_start);
      const schedEnd   = parseTime(entry.school_time_end);
  
      return newStart >= schedStart && newEnd <= schedEnd;
    });
  
    if (!adjacentEntry) return false;

    if (currentEntry && adjacentEntry.course_code === currentEntry.course_code) {
      return "same"; 
    } else {
      return "different";
    }
  };
    
  const getCenterText = (start, day) => {
    const parseTime = (t) => new Date(`1970-01-01 ${t}`);
    const SLOT_HEIGHT_REM = 2.5;
  
    const slotStart = parseTime(start);
  
    for (const entry of schedule) {
      if (entry.day_description !== day) continue;
  
      const schedStart = parseTime(entry.school_time_start);
      const schedEnd   = parseTime(entry.school_time_end);
  
      if (!(slotStart >= schedStart && slotStart < schedEnd)) continue;
  
      const totalHours = Math.round((schedEnd - schedStart) / (1000 * 60 * 60));
      const idxInBlock = Math.round((slotStart - schedStart) / (1000 * 60 * 60));
  
      const isOdd = totalHours % 2 === 1;
      const centerIndex = isOdd ? (totalHours - 1) / 2 : totalHours / 2;
      const isCenter = idxInBlock === centerIndex;
  
      if (!isCenter) return "";
  
      let marginTop = isOdd ? 0 : -(SLOT_HEIGHT_REM / 2);
      if (!isOdd) marginTop = `calc(${marginTop}rem - 1rem)`;
  
      let text;
      if (totalHours === 1) {
        text = (
          <>
            <span className="block truncate text-[10px]">{entry.course_code}</span>
            <span className="block truncate text-[8px]">
              {entry.room_description === "TBA" ? "TBA" : `${entry.program_code} - ${entry.section_description}`}
            </span>
            <span className="block truncate text-[8px]">
              {entry.prof_lastname === "TBA" ? "TBA" : `Prof. ${entry.prof_lastname}`}
            </span>
          </>
        );
      } else {
        text = (
          <>
            {entry.course_code} <br />
            ({entry.room_description === "TBA" ? "TBA" : `${entry.program_code} - ${entry.section_description}`})
            <br />
            {entry.prof_lastname === "TBA" ? "TBA" : `Prof. ${entry.prof_lastname}`}
          </>
        );
      }
  
      return (
        <span
          className={`relative inline-block text-center ${
            totalHours === 1 ? "text-[10px]" : "text-[11px]"
          }`}
          style={{ marginTop }}
        >
          {text}
        </span>
      );
    }
  
    return "";
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"  // <-- align to top
      minHeight="100vh"
      bgcolor="#fdfdfd"
      px={2}
      pt={5}  // <-- add top padding for spacing from top edge
    >

      <Typography
        variant="h4"
        fontWeight="bold"
        color="maroon"
        textAlign="center"
        gutterBottom
      >
        Schedule Checker
      </Typography>

      {message && (
        <Snackbar
          open={openSnackbar}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={
              message.includes("success") || 
              message.includes("available")  // covers "Schedule is available"
                ? "success"
                : "error"
            }
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        </Snackbar>
      )}
      
      <Box sx={{display: "flex", gap: "1rem"}}>
        <Box>
          <Box sx={{display: "flex", gap: "1rem", marginTop: "1.3rem"}}>
            <FormControl fullWidth>
              <InputLabel>Room</InputLabel>
              <Select
                label="Room"
                value={selectedRoom2}
                onChange={(e) => setSelectedRoom2(e.target.value)}
              >
                {roomList.map((room) => (
                  <MenuItem key={room.room_id} value={room.room_id}>{room.room_description}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <form
            onSubmit={handleInsert}
            style={{
              width: "100%",
              maxWidth: "600px",
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
              marginTop: "1rem",
            }}
          >
            {/* Day */}
            <div className="flex mb-2">
              <div className="p-2 w-[12rem]">Day:</div>
              <select className="border border-gray-500 outline-none rounded w-full" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} required>
                <option value="">Select Day</option>
                {dayList.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div className="flex mb-2">
              <div className="p-2 w-[12rem]">Section:</div>
              <select className="border border-gray-500 outline-none rounded w-full" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} required>
                <option value="">Select Section</option>
                {sectionList.map((section) => (
                  <option key={section.dep_section_id} value={section.section_id}>
                    {section.description} {section.program_code}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div className="flex mb-2">
              <div className="p-2 w-[12rem]">Room:</div>
              <select className="border border-gray-500 outline-none rounded w-full" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} required>
                <option value="">Select Room</option>
                {roomList.map((room) => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.room_description}
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div className="flex mb-2">
              <div className="p-2 w-[12rem]">Course:</div>
              <select className="border border-gray-500 outline-none rounded w-full" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required>
                <option value="">Select Course</option>
                {courseList.map((subject) => (
                  <option key={subject.course_id} value={subject.course_id}>
                    {subject.course_code} - {subject.course_description}
                  </option>
                ))}
              </select>
            </div>

            {/* Professor */}
            <div className="flex mb-2">
              <div className="p-2 w-[12rem]">Professor:</div>
              <select className="border border-gray-500 outline-none rounded w-full" value={selectedProf} onChange={(e) => setSelectedProf(e.target.value)} required>
                <option value="">Select Professor</option>
                {profList.map((prof) => (
                  <option key={prof.prof_id} value={prof.prof_id}>
                    {prof.lname}, {prof.fname} {prof.mname}
                  </option>
                ))}
              </select>
            </div>

            {/* School Year */}
            <div className="flex mb-2">
              <div className="p-2 w-[12rem]">School Year:</div>
              <div className="border border-gray-500 rounded w-full p-2 bg-gray-100">
                {
                  schoolYearList.find(sy => sy.id === selectedSchoolYear)?.year_description
                } - {
                  schoolYearList.find(sy => sy.id === selectedSchoolYear)?.semester_description
                }
              </div>
            </div>

            {/* Start Time */}
            <div className="flex mb-2">
              <div className="p-2 w-[12rem]">Start Time:</div>
              <input className="border border-gray-500 rounded p-2 w-full" type="time" value={selectedStartTime} onChange={(e) => setSelectedStartTime(e.target.value)} required />
            </div>

            {/* End Time */}
            <div className="flex mb-4">
              <div className="p-2 w-[12rem]">End Time:</div>
              <input className="border border-gray-500 rounded p-2 w-full" type="time" value={selectedEndTime} onChange={(e) => setSelectedEndTime(e.target.value)} required />
            </div>

            <div className="flex justify-between">
              <button className="bg-[#800000] hover:bg-red-900 text-white px-6 py-2 rounded" onClick={handleSubmit}>
                Check Schedule
              </button>
              <button className="bg-[#800000] hover:bg-red-900 text-white px-6 py-2 rounded" type="submit">
                Insert Schedule
              </button>
            </div>
          </form>
        </Box>
        <table className='mt-[0.7rem]'>
          <thead className="">
            <tr className='flex align-center'>
              <td className='min-w-[6.5rem] min-h-[2.2rem] flex items-center justify-center border border-black text-[14px] '>TIME</td>
              <td className='p-0 m-0'>
                <div className='min-w-[6.6rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>DAY</div>
                <p className='min-w-[6.6rem] text-center border border-black border-l-0 text-[11.5px] font-bold mt-[-3px]'>Official Time</p>
              </td>
              <td className='p-0 m-0'>
                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>MONDAY</div>
                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
              </td>
              <td className='p-0 m-0'>
                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>TUESDAY</div>
                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
              </td>
              <td className='p-0 m-0'>
                <div className='min-w-[7rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>WEDNESDAY</div>
                <p className='min-w-[7rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
              </td>
              <td className='p-0 m-0'>
                <div className='min-w-[6.9rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>THURSDAY</div>
                <p className='min-w-[6.9rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
              </td>
              <td className='p-0 m-0'>
                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>FRIDAY</div>
                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
              </td>
              <td className='p-0 m-0'>
                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>SATUDAY</div>
                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
              </td>
              <td className='p-0 m-0'>
                <div className='min-w-[6.8rem] text-center border border-black border-l-0 border-b-0 text-[14px]'>SUNDAY</div>
                <p className='min-w-[6.8rem] text-center border border-black border-l-0 text-[11.5px] mt-[-3px]'>7:00AM - 9:00PM</p>
              </td>
            </tr>
          </thead>
          <tbody className='flex flex-col mt-[-0.1px]'>
            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  07:00 AM - 08:00 AM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("7:00 AM", "8:00 AM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("7:00 AM", "8:00 AM", day) && hasAdjacentSchedule("7:00 AM", "8:00 AM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("7:00 AM", "8:00 AM", day) && hasAdjacentSchedule("7:00 AM", "8:00 AM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >
                     {getCenterText("7:00 AM", day)}
                  </div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  08:00 AM - 09:00 AM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("8:00 AM", "9:00 AM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("8:00 AM", "9:00 AM", day) && hasAdjacentSchedule("8:00 AM", "9:00 AM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("8:00 AM", "9:00 AM", day) && hasAdjacentSchedule("8:00 AM", "9:00 AM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >
                     {getCenterText("8:00 AM", day)}
                  </div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  09:00 AM - 10:00 AM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("9:00 AM", "10:00 AM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("9:00 AM", "10:00 AM", day) && hasAdjacentSchedule("9:00 AM", "10:00 AM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("9:00 AM", "10:00 AM", day) && hasAdjacentSchedule("9:00 AM", "10:00 AM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >
                     {getCenterText("9:00 AM", day)}
                  </div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  10:00 AM - 11:00 AM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("10:00 AM", "11:00 AM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("10:00 AM", "11:00 AM", day) && hasAdjacentSchedule("10:00 AM", "11:00 AM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("10:00 AM", "11:00 AM", day) && hasAdjacentSchedule("10:00 AM", "11:00 AM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >
                    {getCenterText("10:00 AM", day)}
                  </div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  11:00 AM - 12:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("11:00 AM", "12:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("11:00 AM", "12:00 PM", day) && hasAdjacentSchedule("11:00 AM", "12:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("11:00 AM", "12:00 PM", day) && hasAdjacentSchedule("11:00 AM", "12:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >
                    {getCenterText("11:00 AM", day)}
                  </div>
                </td>
              ))}
            </tr>
            
            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  12:00 PM - 01:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("12:00 PM", "1:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("12:00 PM", "1:00 PM", day) && hasAdjacentSchedule("12:00 PM", "1:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("12:00 PM", "1:00 PM", day) && hasAdjacentSchedule("12:00 PM", "1:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >
                    {getCenterText("12:00 PM", day)}
                  </div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  01:00 PM - 02:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("1:00 PM", "2:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("1:00 PM", "2:00 PM", day) && hasAdjacentSchedule("1:00 PM", "2:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("1:00 PM", "2:00 PM", day) && hasAdjacentSchedule("1:00 PM", "2:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >
                    {getCenterText("1:00 PM", day)}
                  </div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  02:00 PM - 03:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("2:00 PM", "3:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("2:00 PM", "3:00 PM", day) && hasAdjacentSchedule("2:00 PM", "3:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("2:00 PM", "3:00 PM", day) && hasAdjacentSchedule("2:00 PM", "3:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >{getCenterText("2:00 PM", day)}</div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  03:00 PM - 04:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("3:00 PM", "4:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("3:00 PM", "4:00 PM", day) && hasAdjacentSchedule("3:00 PM", "4:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("3:00 PM", "4:00 PM", day) && hasAdjacentSchedule("3:00 PM", "4:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >{getCenterText("3:00 PM", day)}</div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  04:00 PM - 05:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("4:00 PM", "5:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("4:00 PM", "5:00 PM", day) && hasAdjacentSchedule("4:00 PM", "5:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("4:00 PM", "5:00 PM", day) && hasAdjacentSchedule("4:00 PM", "5:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >{getCenterText("4:00 PM", day)}</div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  05:00 PM - 06:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("5:00 PM", "6:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("5:00 PM", "6:00 PM", day) && hasAdjacentSchedule("5:00 PM", "6:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("5:00 PM", "6:00 PM", day) && hasAdjacentSchedule("5:00 PM", "6:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >{getCenterText("5:00 PM", day)}</div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  06:00 PM - 07:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("6:00 PM", "7:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("6:00 PM", "7:00 PM", day) && hasAdjacentSchedule("6:00 PM", "7:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("6:00 PM", "7:00 PM", day) && hasAdjacentSchedule("6:00 PM", "7:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >{getCenterText("6:00 PM", day)}</div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  07:00 PM - 08:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("7:00 PM", "8:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("7:00 PM", "8:00 PM", day) && hasAdjacentSchedule("7:00 PM", "8:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("7:00 PM", "8:00 PM", day) && hasAdjacentSchedule("7:00 PM", "8:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >{getCenterText("7:00 PM", day)}</div>
                </td>
              ))}
            </tr>

            <tr className='flex w-full'>
              <td className='m-0 p-0 min-w-[13.1rem]'>
                <div className='h-[2.5rem] border border-black border-t-0 text-[14px] flex items-center justify-center'>
                  08:00 PM - 09:00 PM
                </div>
              </td>

              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day, i) => (
                <td key={day} className={`m-0 p-0 ${day==="WED" ? "min-w-[7rem]" : day==="THU" ? "min-w-[6.9rem]" : "min-w-[6.8rem]"}`}>
                  <div className={`h-[2.5rem] border border-black border-t-0 border-l-0 text-[14px] flex items-center justify-center  
                    ${isTimeInSchedule("8:00 PM", "9:00 PM", day) ? 'bg-yellow-300' : ''} 
                    ${isTimeInSchedule("8:00 PM", "9:00 PM", day) && hasAdjacentSchedule("8:00 PM", "9:00 PM", day, "top") === "same" ? "border-t-0" : ''} 
                    ${isTimeInSchedule("8:00 PM", "9:00 PM", day) && hasAdjacentSchedule("8:00 PM", "9:00 PM", day, "bottom") === "same" ? "border-b-0" : ''}`}
                  >{getCenterText("8:00 PM", day)}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Box>
    </Box>
  );

};

export default ScheduleChecker;