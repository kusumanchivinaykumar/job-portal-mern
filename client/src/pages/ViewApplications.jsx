import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const ViewApplications = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://job-portal-server-alpha-eight.vercel.app'
  const [searchParams] = useSearchParams()
  const [applicants, setApplicants] = useState([])

  const jobId = searchParams.get('jobId')

  useEffect(() => {
    const fetchApplicants = async () => {
      const recruiterToken = localStorage.getItem('recruiterToken')
      if (!recruiterToken) return
      try {
        let url = jobId 
          ? `/api/company/applicants/${jobId}` 
          : `/api/company/applicants`
        
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${recruiterToken}` }
        })
        setApplicants(res.data?.applicants || [])
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch applicants')
      }
    }
    fetchApplicants()
  }, [jobId])

  const changeStatus = async (applicantId, status) => {
    const recruiterToken = localStorage.getItem('recruiterToken')
    
    // Find the applicant to get the jobId if not in params
    const applicant = applicants.find(app => app._id === applicantId)
    const targetJobId = jobId || applicant?.jobId

    if (!recruiterToken || !targetJobId) return

    try {
      await axios.post('/api/company/change-status', { jobId: targetJobId, applicantId, status }, {
        headers: { Authorization: `Bearer ${recruiterToken}` }
      })
      setApplicants(prev => prev.map(app => app._id === applicantId ? { ...app, status } : app))
      toast.success('Status updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  return (
    <div className='container mx-auto p-4'>
      <div>
        <table className='w-full bg-white border border-gray-200 max-sm:text-sm'>
          <thead>
            <tr className='border-b'>
              <th className='py-2 px-4 text-left'>#</th>
              <th className='py-2 px-4 text-left'>User Name</th>
              <th className='py-2 px-4 text-left max-sm:hidden'>Job Title</th>
              <th className='py-2 px-4 text-left max-sm:hidden'>Status</th>
              <th className='py-2 px-4 text-left'>Resume</th>
              <th className='py-2 px-4 text-left'>Action</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant, index)=>(
              <tr key={applicant._id} className='text-gray-700'>
                <td className='py-2 px-4 border-b text-center'>{index +1}</td>
                <td className='py-2 px-4 border-b text-center flex'>
                  <img className='w-10 h-10 rounded-full mr-3 max-sm:hidden' src={assets.profile_img} alt="" />
                  <span>{applicant.user?.name || applicant.user?.email || 'User'}</span>
                </td>
                <td className='py-2 px-4 border-b max-sm:hidden'>{applicant.jobTitle}</td>
                <td className='py-2 px-4 border-b max-sm:hidden'>{applicant.status}</td>
                <td className='py-2 px-4 border-b'>
                  {applicant.resume ? (
                    <a 
                      className='bg-blue-50 text-blue-400 px-3 py-1 inline-flex gap-2 items-center' 
                      href={applicant.resume.startsWith('http') ? applicant.resume : `${backendUrl}${applicant.resume.startsWith('/') ? '' : '/'}${applicant.resume}`} 
                      target='_blank' 
                      rel='noopener noreferrer'
                      download
                    >
                      Resume <img src={assets.resume_download_icon} alt="" />
                    </a>
                  ) : (
                    <span className='text-gray-400'>No resume</span>
                  )}
                </td>
                <td className='py-2 px-4 border-b relative'>
                  <div className='relative inline-block text-left group'>
                    <button className='text-gray-500 action-button'>...</button>
                    <div className='z-10 hidden absolute right-0 md:left-0 top-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow group-hover:block'>
                      <button onClick={() => changeStatus(applicant._id, 'Accepted')} className='block w-full text-left px-4 py-2 text-blue-500 hover:bg-gray-100'>Accept</button>
                      <button onClick={() => changeStatus(applicant._id, 'Rejected')} className='block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100'>Reject</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ViewApplications
