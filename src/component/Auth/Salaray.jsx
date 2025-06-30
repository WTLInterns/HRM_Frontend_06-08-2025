import React from "react";

const Salary = () => {
  return (
    <div className="bg-gray-100 p-6 flex justify-center items-center min-h-screen">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg">
        <header className="bg-blue-600 text-white text-center py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">Salary Slip Format</h1>
        </header>

        <div className="p-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <div className="text-left">
              <h2 className="font-bold">Company Name & Address</h2>
            </div>
            <div className="bg-blue-400 text-white font-bold p-2 rounded-lg">
              Company Logo
            </div>
          </div>

          <table className="w-full text-left text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="border border-gray-300 px-4 py-2">
                  Salary Details
                </th>
                <th className="border border-gray-300 px-4 py-2">Per Annum</th>
                <th className="border border-gray-300 px-4 py-2">Per Month</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Gross Salary",
                "Basic",
                "House Rent Allowances",
                "Special Allowance",
                "Medical Allowance",
                "Conveyance",
                "City Competency Allowance",
              ].map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">{item}</td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <div className="flex justify-between bg-blue-500 text-white px-4 py-2">
              <span>Gross Salary</span>
              <span>-</span>
            </div>
            <div className="mt-2">
              <table className="w-full text-left text-sm border-collapse border border-gray-300">
                <tbody>
                  {["PF Employee Contribution", "ESI", "PT"].map(
                    (item, index) => (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="border border-gray-300 px-4 py-2">
                          {item}
                        </td>
                        <td className="border border-gray-300 px-4 py-2"></td>
                        <td className="border border-gray-300 px-4 py-2"></td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between bg-blue-300 text-white px-4 py-2 mt-4">
              <span>Net Salary</span>
              <span>-</span>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-4">
            <div className="flex justify-between bg-blue-500 text-white px-4 py-2">
              <span>Current Cost to the Company</span>
              <span>-</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-4">
            <div className="flex justify-between items-center border-t border-gray-300 pt-4">
              <div>
                <p>Employee Signature:</p>
                <div className="h-12 border-b-2 border-gray-300 w-48"></div>
              </div>
              <div>
                <p>Employer Signature:</p>
                <div className="h-12 border-b-2 border-gray-300 w-48"></div>
              </div>
            </div>
          </div>
        </div>

        <footer className="bg-blue-600 text-white text-center py-2 rounded-b-lg">
          <h2 className="text-lg font-bold">sumHR</h2>
        </footer>
      </div>
    </div>
  );
};

export default Salary;
