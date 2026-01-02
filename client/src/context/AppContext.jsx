import React, { createContext, useEffect, useState } from "react";
import { jobsData } from "../assets/assets";
import axios from "axios";

// Point axios to backend during development
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

  const [searchFilter, setSearchFilter] = useState({
    title: '',
    location: ''
  })

  const [isSearched, setIsSearched] = useState(false)

  const [jobs, setJobs] = useState([])

  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false)

  // Recruiter state (used by RecruiterLogin)
  const [recruiter, setRecruiter] = useState(null)

  //Function to fetch jobs
  const fetchJobs = async () => {
    try {
      const res = await axios.get('/api/jobs');
      setJobs(res.data?.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs from API, falling back to demo data.', error);
      setJobs(jobsData);
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const [user, setUser] = useState(null);

  const value = {
    user, setUser,
    searchFilter, setSearchFilter,
    isSearched, setIsSearched,
    jobs, setJobs,
    showRecruiterLogin, setShowRecruiterLogin,
    recruiter, setRecruiter,
    fetchJobs
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
