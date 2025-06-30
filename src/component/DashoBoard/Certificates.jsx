import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaFileSignature, FaFileContract, FaFileInvoiceDollar, FaUserTie, FaArrowUp, FaUserMinus, FaCertificate, FaAward, FaChartLine, FaStar } from 'react-icons/fa';
import { MdBusinessCenter } from 'react-icons/md';
import { useApp } from '../../context/AppContext';

const Certificates = () => {
  const { isDarkMode } = useApp();

  // Add console logging to help with debugging
  console.log("Certificates Component Rendering");

  const certificateTypes = [
    {
      title: 'Company Letter Head',
      icon: <MdBusinessCenter className="text-3xl text-blue-500" />, 
      description: 'Official company letterhead template',
      path: '/dashboard/letterhead'
    },
    {
      title: 'Appointment Letter',
      icon: <FaFileSignature className="text-3xl text-emerald-600" />, 
      description: 'New employee appointment documents',
      path: '/dashboard/appointment'
    },
    {
      title: 'Joining Letter',
      icon: <FaFileAlt className="text-3xl text-violet-600" />, 
      description: 'Employee joining confirmation',
      path: '/dashboard/joining'
    },
    {
      title: 'Agreement/Contract',
      icon: <FaFileContract className="text-3xl text-amber-600" />, 
      description: 'Employment terms and conditions',
      path: '/dashboard/agreement'
    },
    {
      title: 'Increment Letter',
      icon: <FaFileInvoiceDollar className="text-3xl text-rose-500" />, 
      description: 'Salary increment notification',
      path: '/dashboard/increment'
    },
    {
      title: 'Experience Letter',
      icon: <FaUserTie className="text-3xl text-indigo-600" />, 
      description: 'Work experience certification',
      path: '/dashboard/experience'  // Make sure this path matches the route in DashboardRouter
    },

    {
      title: 'Relieving Letter',
      icon: <FaArrowUp className="text-3xl text-green-600" />,
      description: 'Letter acknowledging employee release',
      path: '/dashboard/relieving'
    },
    {
      title: 'Exit Letter',
      icon: <FaUserMinus className="text-3xl text-red-500" />,
      description: 'Exit formalities and confirmation',
      path: '/dashboard/exit'
    },
   
    {
      title: 'Termination Letter',
      icon: <FaUserMinus className="text-3xl text-red-600" />, 
      description: 'Employment termination notice',
      path: '/dashboard/termination'
    }
  ];


  const Certificates = [
    {

      

    }

  ];

  const internshipCertificates = [
    {
      title: 'Internship Completion Certificate',
      icon: <FaCertificate className="text-3xl text-red-500" />, 
      description: 'Certificate for successful internship completion',
      path: '/dashboard/internship-completion'
    },
    {
      title: 'Achievement Certificate',
      icon: <FaAward className="text-3xl text-green-500" />, 
      description: 'Recognition of outstanding achievements',
      path: '/dashboard/achievement'
    },
    {
      title: 'Performance Certificate',
      icon: <FaChartLine className="text-3xl text-yellow-500" />, 
      description: 'Certificate reflecting performance evaluation',
      path: '/dashboard/performance'
    },
    {
      title: 'Post Appraisal Certificate',
      icon: <FaStar className="text-3xl text-purple-500" />, 
      description: 'Certificate post appraisal review',
      path: '/dashboard/post-appraisal'
    }
  ];

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'} backdrop-blur-md rounded-lg shadow-lg border animate-fadeIn`}>
      <h1 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Letters</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {certificateTypes.map((cert, index) => (
          <Link
            key={index}
            to={cert.path}
            className={`group p-3 ${isDarkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-gray-50/70 border-gray-200'} rounded-lg border shadow-md transform transition-all duration-300 hover:scale-102 hover:shadow-lg hover:border-blue-500/50`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`p-2 ${isDarkMode ? 'bg-slate-800/80 group-hover:bg-slate-700/80' : 'bg-gray-100/80 group-hover:bg-gray-200/80'} rounded-full transition-colors duration-300`}>
                {React.cloneElement(cert.icon, { className: `${cert.icon.props.className} text-2xl` })}
              </div>
              
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} group-hover:text-blue-600 transition-colors duration-300 line-clamp-1`}>
                {cert.title}
              </h3>
              
              <p className={`text-xs ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} transition-colors duration-300 line-clamp-2`}>
                {cert.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Certificates</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {internshipCertificates.map((cert, index) => (
            <Link
              key={index}
              to={cert.path}
              className={`group p-3 ${isDarkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-gray-50/70 border-gray-200'} rounded-lg border shadow-md transform transition-all duration-300 hover:scale-102 hover:shadow-lg hover:border-blue-500/50`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-2 ${isDarkMode ? 'bg-slate-800/80 group-hover:bg-slate-700/80' : 'bg-gray-100/80 group-hover:bg-gray-200/80'} rounded-full transition-colors duration-300`}>
                  {React.cloneElement(cert.icon, { className: `${cert.icon.props.className} text-2xl` })}
                </div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} group-hover:text-blue-600 transition-colors duration-300 line-clamp-1`}>
                  {cert.title}
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} transition-colors duration-300 line-clamp-2`}>
                  {cert.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Certificates;
