import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { assets } from '../assets/assets'
import moment from 'moment'
import Footer from '../components/Footer'
import { useClerk, useUser } from '@clerk/clerk-react'

const Applications = () => {

  const [isEdit, setIsEdit] = useState(false)
  const [resume, setResume] = useState(null)
  const [jobsApplied, setJobsApplied] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState("")
  const [statusType, setStatusType] = useState("") // 'success' | 'error' | ''

  const { openSignIn } = useClerk()
  const { user } = useUser()

  // Fetch applied jobs from backend
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        if (!user) {
          setLoading(false)
          return
        }

        let token = localStorage.getItem('userToken')
        if (!token) {
          const { data } = await axios.post('/api/jobs/auth', {
            userId: user.id,
            name: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
            image: user.imageUrl
          })
          token = data.token
          localStorage.setItem('userToken', token)
        }

        const res = await axios.get('/api/jobs/applied', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setJobsApplied(res.data)
      } catch (error) {
        setStatusType('error')
        setStatusMessage(error.response?.data?.message || 'Failed to load applied jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchAppliedJobs()
  }, [user])

  const handleSaveResume = async () => {
    try {
      if (!user) {
        setStatusType('error')
        setStatusMessage('Please login to save your resume')
        openSignIn()
        return
      }

      if (!resume) {
        setIsEdit(false)
        setStatusType('error')
        setStatusMessage('Please upload resume')
        return
      }
      const formData = new FormData()
      formData.append('resume', resume)

      let token = localStorage.getItem('userToken')
      if (!token) {
        const { data } = await axios.post('/api/jobs/auth', {
          userId: user.id,
          name: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
          image: user.imageUrl
        })
        token = data.token
        localStorage.setItem('userToken', token)
      }

      await axios.post('/api/jobs/resume', formData, {
        headers: {
          // Let Axios set multipart boundary automatically
          Authorization: `Bearer ${token}`
        }
      })
      setStatusType('success')
      setStatusMessage('Resume saved successfully')
      setIsEdit(false)
      setResume(null)
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          // Refresh token tied to current Clerk user and retry once
          localStorage.removeItem('userToken')
          const { data } = await axios.post('/api/jobs/auth', { userId: user.id, name: user.fullName, email: user.primaryEmailAddress?.emailAddress, image: user.imageUrl })
          const newToken = data.token
          localStorage.setItem('userToken', newToken)
          await axios.post('/api/jobs/resume', (() => { const fd = new FormData(); fd.append('resume', resume); return fd; })(), {
            headers: { Authorization: `Bearer ${newToken}` }
          })
          setStatusType('success')
          setStatusMessage('Resume saved successfully')
          setIsEdit(false)
          setResume(null)
          return
        } catch (err2) {
          setStatusType('error')
          setStatusMessage(err2.response?.data?.message || 'Failed to save resume')
          return
        }
      }
      setStatusType('error')
      setStatusMessage(error.response?.data?.message || 'Failed to save resume')
    }
  }

  return (
    <>
      <Navbar />

      <div className='container px-4 min-h-[65vh] 2xl:px-20 mx-auto my-20'>
        {/* Resume Section */}
        <h2 className='text-xl font-semibold'>Your Resume</h2>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mt-3 mb-2 p-3 rounded ${statusType === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
            {statusMessage}
          </div>
        )}

        {/* Login prompt when not signed in */}
        {!user && (
          <div className='mt-3 mb-6 p-3 rounded bg-blue-50 text-blue-700 border border-blue-200'>
            Please login to view your applied jobs and manage your resume.
            <button onClick={() => openSignIn()} className='ml-3 bg-blue-600 text-white px-4 py-2 rounded'>Login</button>
          </div>
        )}

        <div className='flex gap-2 mb-6 mt-3'>
          {isEdit ? (
            <>
              <label className='flex items-center' htmlFor="resumeUpload">
                <p className='bg-blue-100 text-blue-600 px-4 py-2 rounded-lg mr-2'>
                  Select Resume
                </p>
                <input
                  id='resumeUpload'
                  type="file"
                  accept=".pdf,.doc,.docx"
                  hidden
                  onChange={e => setResume(e.target.files[0])}
                />
                <img src={assets.profile_upload_icon} alt="" />
              </label>

              <button
                onClick={handleSaveResume}
                className='bg-green-100 border border-green-400 rounded-lg px-4 py-2'
              >
                Save
              </button>

              <button
                onClick={() => { setIsEdit(false); setResume(null); }}
                className='text-gray-500 border border-gray-300 rounded-lg px-4 py-2'
              >
                Cancel
              </button>
            </>
          ) : (
            <div className='flex gap-2'>
              <span className='bg-blue-100 text-blue-600 px-4 py-2 rounded-lg'>
                Resume
              </span>
              <button
                onClick={() => setIsEdit(true)}
                className='text-gray-500 border border-gray-300 rounded-lg px-4 py-2'
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Applied Jobs Section */}
        <h2 className='text-xl font-semibold mb-4'>Jobs Applied</h2>

        {loading ? (
          <p>Loading...</p>
        ) : !user ? (
          <p className='text-gray-600'>Login to view your applied jobs.</p>
        ) : jobsApplied.length === 0 ? (
          <p>No jobs applied yet.</p>
        ) : (
          <table className='min-w-full bg-white border rounded-lg'>
            <thead>
              <tr>
                <th className='py-3 px-4 border-b text-left'>Company</th>
                <th className='py-3 px-4 border-b text-left'>Job Title</th>
                <th className='py-3 px-4 border-b text-left max-sm:hidden'>Location</th>
                <th className='py-3 px-4 border-b text-left max-sm:hidden'>Date</th>
                <th className='py-3 px-4 border-b text-left'>Status</th>
              </tr>
            </thead>

            <tbody>
              {jobsApplied.map((job, index) => (
                <tr key={index}>
                  <td className='py-3 px-4 flex items-center gap-2 border-b'>
                    <img
                      className='w-8 h-8'
                      src={job.companyId?.image}
                      alt=""
                    />
                    {job.companyId?.name}
                  </td>

                  <td className='py-2 px-4 border-b'>
                    {job.title}
                  </td>

                  <td className='py-2 px-4 border-b max-sm:hidden'>
                    {job.location}
                  </td>

                  <td className='py-2 px-4 border-b max-sm:hidden'>
                    {moment(job.createdAt).format('ll')}
                  </td>

                  <td className='py-2 px-4 border-b'>
                    <span
                      className={`px-4 py-1.5 rounded
                        ${job.status === 'Accepted'
                          ? 'bg-green-100'
                          : job.status === 'Rejected'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}
                    >
                      {job.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Footer />
    </>
  )
}

export default Applications
