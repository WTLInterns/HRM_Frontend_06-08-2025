"use client"

import React, { useState, useEffect } from "react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import companyLogo from "../../assets/company.jpeg"     // The company logo
import WtlSign from "../../assets/WTL Sign.jpg"         // The WTL sign
import axios from "axios"
import { FaDownload, FaPrint, FaMoneyBill } from "react-icons/fa"
import "../DashoBoard/animations.css"
import { useApp } from "../../context/AppContext"

// Helper: format date from "YYYY-MM-DD" to "DD-MM-YYYY"
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A"
  const parts = dateStr.split("-")
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

// Helpers for converting numbers to words
const numberToWordsHelper = (num) => {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  let str = ""
  if (num > 99) {
    str += a[Math.floor(num / 100)] + " Hundred "
    num = num % 100
  }
  if (num > 19) {
    str += b[Math.floor(num / 10)] + " " + a[num % 10]
  } else {
    str += a[num]
  }
  return str.trim()
}
const numberToWords = (num) => {
  if (num == null) return ""
  const numStr = num.toString()
  if (numStr.length > 9) return "Overflow"
  const n = ("000000000" + numStr).substr(-9).match(/.{1,3}/g)
  let str = ""
  str += Number(n[0]) !== 0 ? numberToWordsHelper(Number(n[0])) + " Million " : ""
  str += Number(n[1]) !== 0 ? numberToWordsHelper(Number(n[1])) + " Thousand " : ""
  str += Number(n[2]) !== 0 ? numberToWordsHelper(Number(n[2])) : ""
  return str.trim()
}

// Convert a string to Title Case
const toTitleCase = (str) => {
  if (!str) return str
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

// Calculate monthly salary components from yearly CTC
const calculateSalaryComponents = (yearlyCTC) => {
  const monthlyCTC = yearlyCTC / 12
  const basicPercent = 0.5 // 50% of CTC
  const hraPercent = 0.2  // 20% of CTC
  const daPercent = 0.53  // 53% of Basic

  const basic = Math.round(monthlyCTC * basicPercent)
  const hra = Math.round(monthlyCTC * hraPercent)
  const da = Math.round(basic * daPercent)
  const special = Math.round(monthlyCTC - (basic + hra + da))
  const totalAllowance = hra + da + special
  const grossSalary = basic + totalAllowance

  return {
    basic,
    hra,
    da,
    special,
    totalAllowance,
    grossSalary,
    monthlyCTC,
  }
}

const SalarySlip = () => {
  const { user } = useApp()
  const [salaryData, setSalaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ]

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  )

  useEffect(() => {
    fetchSalarySlip()
  }, [month, year])

  const fetchSalarySlip = async () => {
    if (!user) return
    
    setLoading(true)
    setError("")
    
    try {
      // This is a mock implementation - replace with actual API call
      // const response = await axios.get(`http://localhost:8282/salary/slip/${user.id}?month=${month}&year=${year}`);
      // setSalaryData(response.data);
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockData = {
          employeeId: "EMP123",
          name: user?.firstName + " " + user?.lastName || "John Doe",
          email: user?.email || "john@example.com",
          designation: "Software Developer",
          month: months.find(m => m.value === month)?.label,
          year: year,
          basicSalary: 50000,
          hra: 15000,
          conveyanceAllowance: 5000,
          medicalAllowance: 3000,
          otherAllowances: 7000,
          grossSalary: 80000,
          pf: 6000,
          professionalTax: 200,
          incomeTax: 5000,
          loanDeduction: 0,
          otherDeductions: 1000,
          totalDeductions: 12200,
          netSalary: 67800,
          daysWorked: 22,
          totalDays: 22
        };
        
        setSalaryData(mockData)
        setLoading(false)
      }, 1000)
      
    } catch (err) {
      console.error("Error fetching salary slip:", err)
      setError("Failed to fetch salary slip. Please try again later.")
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Mock download functionality
  const handleDownload = () => {
    alert("Download functionality would be implemented here.")
  }

  return (
    <div className="p-4 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 transform transition duration-300 hover:scale-105">Salary Slip</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 transform transition duration-300 hover:shadow-xl card">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center text-blue-600">
            <FaMoneyBill className="text-2xl mr-2 animate-float" />
            <h3 className="text-lg font-medium">Select Period</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="transform transition duration-300 hover:translate-y-[-2px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out hover:border-blue-300"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out hover:border-blue-300"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg animate-pulse">
          {error}
        </div>
      ) : salaryData ? (
        <div className="bg-white p-6 rounded-lg shadow-lg printable-content animate-slideIn">
          {/* Salary Slip Header */}
          <div className="text-center mb-6 border-b pb-4">
            <h3 className="text-xl font-bold text-gray-800">Company Name</h3>
            <p className="text-gray-600">Salary Slip for {salaryData.month} {salaryData.year}</p>
          </div>
          
          {/* Employee Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 border-b pb-4">
            <div>
              <p className="text-sm text-gray-600">Employee ID</p>
              <p className="font-medium">{salaryData.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{salaryData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{salaryData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Designation</p>
              <p className="font-medium">{salaryData.designation}</p>
            </div>
          </div>
          
          {/* Salary Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Earnings</h4>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Basic Salary</p>
              <p className="font-medium">₹{salaryData.basicSalary.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">HRA</p>
              <p className="font-medium">₹{salaryData.hra.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Conveyance Allowance</p>
              <p className="font-medium">₹{salaryData.conveyanceAllowance.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Medical Allowance</p>
              <p className="font-medium">₹{salaryData.medicalAllowance.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Other Allowances</p>
              <p className="font-medium">₹{salaryData.otherAllowances.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600 font-semibold">Gross Salary</p>
              <p className="font-bold text-green-600">₹{salaryData.grossSalary.toLocaleString()}</p>
            </div>
            
            <div className="col-span-1 md:col-span-2 mt-4">
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Deductions</h4>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Provident Fund</p>
              <p className="font-medium">₹{salaryData.pf.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Professional Tax</p>
              <p className="font-medium">₹{salaryData.professionalTax.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Income Tax</p>
              <p className="font-medium">₹{salaryData.incomeTax.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600">Other Deductions</p>
              <p className="font-medium">₹{salaryData.otherDeductions.toLocaleString()}</p>
            </div>
            
            <div className="transform transition duration-300 hover:translate-y-[-2px] hover:bg-blue-50 p-2 rounded">
              <p className="text-sm text-gray-600 font-semibold">Total Deductions</p>
              <p className="font-bold text-red-600">₹{salaryData.totalDeductions.toLocaleString()}</p>
        </div>
        </div>
          
          {/* Net Salary */}
          <div className="border-t pt-4 mt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-700">Net Salary</h4>
              <p className="text-xl font-bold text-green-600 animate-pulse-slow">₹{salaryData.netSalary.toLocaleString()}</p>
        </div>
        </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <button 
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform transition duration-300 hover:translate-y-[-2px] hover:shadow-md"
            >
              <FaPrint className="mr-2" /> Print
          </button>
            
              <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transform transition duration-300 hover:translate-y-[-2px] hover:shadow-md"
              >
              <FaDownload className="mr-2" /> Download PDF
              </button>
            </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">No salary data available</div>
      )}
    </div>
  )
}

export default SalarySlip
