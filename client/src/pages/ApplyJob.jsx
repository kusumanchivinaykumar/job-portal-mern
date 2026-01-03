import React, { useCallback, useEffect, useState, useContext } from 'react'
import { useParams } from "react-router-dom"
import axios from "axios"
import { AppContext } from '../context/AppContext'
import Loading from '../components/Loading'
import Navbar from '../components/Navbar'
import { assets } from '../assets/assets'
import kconvert from 'k-convert'
import moment from 'moment'
import JobCard from '../components/JobCard'
import Footer from '../components/Footer'
import { useClerk, useUser } from '@clerk/clerk-react'

const ApplyJob = () => {

  const { id } = useParams()
  const { jobs } = useContext(AppContext)

  const [jobData, setJobData] = useState(null)
  const [resume, setResume] = useState(null)
  const [hasSavedResume, setHasSavedResume] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [statusType, setStatusType] = useState("") // 'success' | 'error' | ''
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const { openSignIn } = useClerk()
  const { user } = useUser()

  // Fetch single job
  useEffect(() => {
    if (jobs.length > 0) {
      const data = jobs.find(job => job._id.toString() === id)
      if (data) {
        setJobData(data)
      } else {
        setNotFound(true)
      }
    }
  }, [id, jobs])

  // Helper to ensure we have a token for the logged-in Clerk user
  const ensureToken = useCallback(async () => {
    let token = localStorage.getItem("userToken")
    if (!token) {
      const { data } = await axios.post('/api/jobs/auth', { 
        userId: user.id, 
        name: user.fullName, 
        email: user.primaryEmailAddress?.emailAddress, 
        image: user.imageUrl 
      })
      token = data.token
      localStorage.setItem("userToken", token)
    }
    return token
  }, [user])

  // Check if user already has a saved resume (only when logged in)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          setHasSavedResume(false)
          return
        }

        const token = await ensureToken()

        const res = await axios.get('/api/jobs/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setHasSavedResume(!!res.data?.resume)
      } catch (e) {
        // Attempt token refresh once on 401 invalid user token
        if (e.response?.status === 401) {
          try {
            localStorage.removeItem('userToken')
            const newTok = await ensureToken()
            const res = await axios.get('/api/jobs/profile', {
              headers: { Authorization: `Bearer ${newTok}` }
            })
            setHasSavedResume(!!res.data?.resume)
            return
          } catch (error) {
            console.log(error)
          }
        }
        setHasSavedResume(false)
      }
    }
    fetchProfile()
  }, [user, ensureToken])

  // Check if already applied
  useEffect(() => {
    const checkApplied = async () => {
      if (!user || !jobData) return
      try {
        const token = await ensureToken()
        const res = await axios.get('/api/jobs/applied', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const appliedJobs = res.data || []
        const exists = appliedJobs.some(job => job._id === jobData._id)
        setIsAlreadyApplied(exists)
      } catch (error) {
        console.error("Failed to check application status", error)
      }
    }
    checkApplied()
  }, [user, jobData, ensureToken])

  // Apply Job Function
  const handleApply = async () => {
    if (!user) {
      setStatusType('error')
      setStatusMessage('Please login first to apply')
      openSignIn()
      return
    }

    if (!resume && !hasSavedResume) {
      setStatusType('error')
      setStatusMessage('Please upload resume')
      return
    }

    try {
      setLoading(true)
      setStatusMessage('')

      const formData = new FormData()
      if (resume) {
        formData.append("resume", resume)
      }

      let token = await ensureToken()

      await axios.post(
        `/api/jobs/apply/${jobData._id}`,
        formData,
        {
          headers: {
            // Let Axios set the correct multipart boundary automatically
            Authorization: `Bearer ${token}`
          }
        }
      )

      setStatusType('success')
      setStatusMessage('Job applied successfully')
      setResume(null)
      setIsAlreadyApplied(true)
    } catch (error) {
      // If invalid token, refresh once and retry
      if (error.response?.status === 401) {
        try {
          localStorage.removeItem('userToken')
          const newTok = await ensureToken()
          await axios.post(
            `/api/jobs/apply/${jobData._id}`,
            resume ? (() => { const fd = new FormData(); fd.append('resume', resume); return fd; })() : new FormData(),
            { headers: { Authorization: `Bearer ${newTok}` } }
          )
          setStatusType('success')
          setStatusMessage('Job applied successfully')
          setResume(null)
          setIsAlreadyApplied(true)
        } catch (err2) {
          setStatusType('error')
          setStatusMessage(err2.response?.data?.message || 'Failed to apply job')
        }
      } else {
        setStatusType('error')
        setStatusMessage(error.response?.data?.message || 'Failed to apply job')
      }
    } finally {
      setLoading(false)
    }
  }

  if (notFound) {
    return (
      <>
        <Navbar />
        <div className='min-h-screen flex items-center justify-center'>
            <p className='text-xl font-semibold text-gray-600'>Job Not Found</p>
        </div>
        <Footer />
      </>
    )
  }

  return jobData ? (
    <>
      <Navbar />

      <div className='min-h-screen flex flex-col py-20 container px-4 2xl:px-20 mx-auto'>
        <div className='bg-white text-black rounded-lg w-full'>

          {/* Top Section */}
          <div className='flex justify-center md:justify-between flex-wrap gap-8 px-14 py-20 mb-6 bg-sky-50 border border-sky-400 rounded-xl'>
            <div className='flex flex-col md:flex-row items-center'>
              <img
                className='h-24 bg-white rounded-lg p-4 mr-4 max-md:mb-4 border'
                src={jobData.companyId?.image}
                alt=""
              />
              <div className='text-center md:text-left text-neutral-700'>
                <h1 className='text-2xl sm:text-4xl font-medium'>{jobData.title}</h1>
                <div className='flex flex-row flex-wrap max-md:justify-center gap-y-2 gap-6 items-center text-gray-600 mt-2'>
                  <span className='flex items-center gap-1'>
                    <img src={assets.suitcase_icon} alt="" />
                    {jobData.companyId?.name}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.location_icon} alt="" />
                    {jobData.location}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.person_icon} alt="" />
                    {jobData.level}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.money_icon} alt="" />
                    CTC: {kconvert.convertTo(jobData.salary)}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center'>
              <p className='mt-1 text-gray-600'>
                Posted {moment(jobData.date).fromNow()}
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className='flex flex-col lg:flex-row justify-between items-start'>
            <div className='w-full lg:w-2/3'>
              <h2 className='font-bold text-2xl mb-4'>Job Description</h2>
              <div
                className='rich-text'
                dangerouslySetInnerHTML={{ __html: jobData.description }}
              />

              {/* Status Message */}
              {statusMessage && (
                <div className={`mt-4 p-3 rounded ${statusType === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                  {statusMessage}
                </div>
              )}

              {/* Resume / Login Section */}
              <div className='mt-6'>
                {!user ? (
                  <div>
                    <p className='text-gray-700'>Please login to apply for this job.</p>
                    <button onClick={() => openSignIn()} className='bg-blue-600 text-white px-6 py-2 rounded mt-2'>Login</button>
                  </div>
                ) : (
                  <>
                    {hasSavedResume ? (
                      <p className='text-green-700'>Resume on file. You can re-upload to replace it.</p>
                    ) : (
                      <p className='text-gray-600'>Upload your resume to apply.</p>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResume(e.target.files[0])}
                      className="mt-2"
                    />
                  </>
                )}
              </div>

              {/* Apply Button */}
              {user && (
                <button
                  onClick={handleApply}
                  disabled={loading || isAlreadyApplied}
                  className={`p-2.5 px-10 text-white rounded mt-4 ${isAlreadyApplied ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600'}`}
                >
                  {loading ? "Applying..." : isAlreadyApplied ? "Already Applied" : "Apply Now"}
                </button>
              )}
            </div>

            {/* More Jobs */}
            <div className='w-full lg:w-1/3 mt-8 lg:mt-0 lg:ml-8 space-y-5'>
              <h2>More jobs from {jobData.companyId?.name}</h2>
              {jobs
                .filter(job =>
                  job._id !== jobData._id &&
                  job.companyId?._id?.toString() === jobData.companyId?._id?.toString()
                )
                .slice(0, 4)
                .map((job, index) => (
                  <JobCard key={index} job={job} />
                ))}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  ) : (
    <>
      <Navbar />
      <Loading />
    </>
  )
}

export default ApplyJob
