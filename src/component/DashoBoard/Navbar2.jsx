import React, { useEffect } from 'react'
import { useApp } from '../../context/AppContext';
import "./animations.css";

const Navbar2 = () => {

    const { fetchAllEmp, emp, logoutUser } = useApp();

    useEffect(() => {
        // Only fetch if the emp array is empty and user is logged in
        const user = JSON.parse(localStorage.getItem('user'));
        if ((!emp || emp.length === 0) && user && user.id) {
            fetchAllEmp();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
      // Count active and inactive employees
      const activeEmp = emp.filter((employee) => employee.status === "Active" || employee.status === "active");
      const inactiveEmp = emp.filter((employee) => employee.status === "Inactive" || employee.status === "inactive");
      const activeEmpCount = activeEmp.length;
      const inactiveEmpCount = inactiveEmp.length;
    
      // Group employees by job role and count active/inactive for each role
      const jobRoleSummary = emp.reduce((acc, employee) => {
        const role = employee.jobRole;
        if (!acc[role]) {
          acc[role] = { active: 0, inactive: 0 };
        }
        if (employee.status === "Active" || employee.status === "active") {
          acc[role].active += 1;
        } else {
          acc[role].inactive += 1;
        }
        return acc;
      }, {});
  
  return (
    <div className="animate-fadeIn">
    <div className="bg-slate-800 shadow-lg p-4 rounded-lg col-span-3 border border-blue-900">
      <h2 className="text-xl font-bold text-gray-100">Employees by Job Role</h2>
      <div className="flex flex-wrap gap-4 mt-4">
        {Object.entries(jobRoleSummary).map(([role, counts], index) => (
          <div
            key={role}
            className="flex flex-col bg-slate-700 p-4 rounded-lg shadow-md w-40 border border-blue-800 hover:border-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-fadeIn"
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            <div className="text-sm font-semibold truncate text-blue-300">{role}</div>
            <div className="flex items-center text-sm mt-2 text-gray-200">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1 animate-pulse-slow"></span>
              <span>{counts.active}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1 animate-pulse-slow"></span>
              <span>{counts.inactive}</span>
            </div>
          </div>
        ))}
      </div>
    </div></div>
  )
}

export default Navbar2