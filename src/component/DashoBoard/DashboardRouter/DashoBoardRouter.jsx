import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../DashBoard";
import AddEmp from "../AddEmp";
import Attendance from "../Attendance";
import Certificates from "../Certificates";
import ExperienceLetter from "../AllCertificates/ExperienceLetter";
import TerminationLetter from "../AllCertificates/TerminationLetter";
import RelievingLetter from "../AllCertificates/RelievingLetter";
import JoiningLetter from "../AllCertificates/JoiningLetter";
import CompanyLetterhead from "../AllCertificates/CompanyLetterhead";
import PostAppraisal from "../AllCertificates/PostAppraisal";
import PerformanceCertificate from "../AllCertificates/PerformanceCertificate";
import Agreement_Contract_Letter from "../AllCertificates/Agreement_Contract_Letter";
import AppointmentLetter from "../AllCertificates/AppointmentLetter";
import ExitLetter from "../AllCertificates/ExitLetter";
import IncrementLetter from "../AllCertificates/IncrementLetter";
import AchievementCertificate from "../AllCertificates/AchievementCertificate";
import IntershipCertificate from "../AllCertificates/IntershipCertificate";
import Expenses from "../Expenses";
import LeaveNotification from "../LeaveNotification";
import Reminders from "../Reminders";



// Resume and Openings components removed

const DashoBoardRouter = () => {
  console.log("Dashboard Router Component Rendering");
  
  return (
    <>
      <Routes>
        {/* Main dashboard route */}
        <Route index element={<Dashboard />} />
        
        {/* Core routes */}
        <Route path="addEmp" element={<AddEmp />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="leave-notification" element={<LeaveNotification />} />
        
        {/* Certificate routes */}
        <Route path="certificates" element={<Certificates />} />
        <Route path="experience" element={<ExperienceLetter />} />
        <Route path="letterhead" element={<CompanyLetterhead />} />
        <Route path="appointment" element={<AppointmentLetter />} />
        <Route path="joining" element={<JoiningLetter />} />
        <Route path="agreement" element={<Agreement_Contract_Letter />} />
        <Route path="increment" element={<IncrementLetter />} />
        <Route path="relieving" element={<RelievingLetter />} />
        <Route path="exit" element={<ExitLetter />} />
        <Route path="termination" element={<TerminationLetter />} />
        
        {/* Internship certificate routes */}
        <Route path="internship-completion" element={<IntershipCertificate />} />
        <Route path="achievement" element={<AchievementCertificate />} />
        <Route path="performance" element={<PerformanceCertificate />} />
        <Route path="post-appraisal" element={<PostAppraisal />} />
      </Routes>
    </>
  );
};

export default DashoBoardRouter;
