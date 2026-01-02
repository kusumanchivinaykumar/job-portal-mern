import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import ConfirmModal from '../components/ConfirmModal'

// Ensure axios hits backend when static-served
axios.defaults.baseURL = axios.defaults.baseURL || 'http://localhost:5000'

const ManageJobs = () => {

  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [jobToDelete, setJobToDelete] = useState(null)

  const fetchJobs = async () => {
    const recruiterToken = localStorage.getItem('recruiterToken')
    if (!recruiterToken) return
    try {
      const res = await axios.get('/api/company/list-jobs', {
        headers: { Authorization: `Bearer ${recruiterToken}` }
      })
      setJobs(res.data?.jobsData || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch company jobs')
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const toggleVisibility = async (jobId) => {
    const recruiterToken = localStorage.getItem('recruiterToken')
    if (!recruiterToken) return
    try {
      await axios.post('/api/company/change-visibility', { id: jobId }, {
        headers: { Authorization: `Bearer ${recruiterToken}` }
      })
      toast.success('Visibility updated')
      fetchJobs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change visibility')
    }
  }

  const handleDeleteClick = (jobId) => {
    setJobToDelete(jobId)
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    if (!jobToDelete) return
    
    const recruiterToken = localStorage.getItem('recruiterToken')
    if (!recruiterToken) return

    try {
      await axios.post('/api/company/delete-job', { id: jobToDelete }, {
        headers: { Authorization: `Bearer ${recruiterToken}` }
      })
      toast.success('Job deleted successfully')
      fetchJobs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete job')
    } finally {
      setShowConfirm(false)
      setJobToDelete(null)
    }
  }

  return (
    <div className='container max-w-5xl p-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border-gray-200 max-sm:text-sm'>
          <thead>
            <tr>
              <th className='py-2 px-4 border-b text-left max-sm:hidden'>#</th>
              <th className='py-2 px-4 border-b text-left'>Job Title</th>
              <th className='py-2 px-4 border-b text-left max-sm:hidden'>Date</th>
              <th className='py-2 px-4 border-b text-left max-sm:hidden'>Location</th>
              <th className='py-2 px-4 border-b text-center'>Applicants</th>
              <th className='py-2 px-4 border-b text-left'>Actions</th>
              <th className='py-2 px-4 border-b text-left'>Visible</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, index)=>(
              <tr key={job._id} className='text-gray-700'>
                <td className='py-2 px-4 border-b max-sm:hidden'>{index+1}</td>
                <td className='py-2 px-4 border-b'>{job.title}</td>
                <td className='py-2 px-4 border-b max-sm:hidden'>{moment(job.date).format('ll')}</td>
                <td className='py-2 px-4 border-b max-sm:hidden'>{job.location}</td>
                <td className='py-2 px-4 border-b text-center'>{job.applicantsCount || 0}</td>
                <td className='py-2 px-4 border-b space-x-3'>
                  <button
                    onClick={() => navigate(`/dashboard/view-applications?jobId=${job._id}`)}
                    className='text-blue-600 hover:underline'
                  >
                    View Applicants
                  </button>
                  <button
                    onClick={() => handleDeleteClick(job._id)}
                    className='text-red-600 hover:underline'
                  >
                    Delete
                  </button>
                </td>
                <td className='py-2 px-4 border-b'>
                  <input className='scale-125 ml-4' type="checkbox" checked={job.visible} onChange={() => toggleVisibility(job._id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        show={showConfirm}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <div className='mt-4 flex justify-end'>
        <button onClick={()=>navigate('/dashboard/add-job')} className='bg-black text-white py-2 px-4 rounded'>Add new job</button>
      </div>
    </div>
  )
}

export default ManageJobs
