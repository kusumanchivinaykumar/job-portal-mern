import React, { useEffect, useRef, useState, useContext } from 'react'
import Quill from 'quill'
import { JobCategories, JobLocations } from '../assets/assets';
import axios from 'axios'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'

// Ensure axios hits the backend API even when static-served
axios.defaults.baseURL = axios.defaults.baseURL || 'http://localhost:5000'

const AddJob = () => {

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Nairobi');
  const [category, setCategory] = useState('Programming');
  const [level, setLevel] = useState('Beginner level');
  const [salary, setSalary] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setShowRecruiterLogin, fetchJobs } = useContext(AppContext)

  const editorRef = useRef(null)
  const quillRef = useRef(null)

  useEffect(() => {
    //Initialize quill only once
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        })
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const recruiterToken = localStorage.getItem('recruiterToken')
    if (!recruiterToken) {
      toast.error('Please login as recruiter to post a job')
      setShowRecruiterLogin(true)
      return
    }

    const description = quillRef.current ? quillRef.current.root.innerHTML : ''
    if (!title || !description || !location || !category || !level || !salary) {
      toast.error('All fields are required')
      return
    }

    try {
      const payload = { title, description, location, salary: Number(salary), level, category }
      await axios.post('/api/company/post-job', payload, {
        headers: { Authorization: `Bearer ${recruiterToken}` }
      })
      toast.success('Job posted successfully')
      fetchJobs()
      // Reset form
      setTitle('')
      setLocation('Nairobi')
      setCategory('Programming')
      setLevel('Beginner level')
      setSalary(0)
      if (quillRef.current) quillRef.current.setContents([])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post job')
    }
  }

  return (
    <div>
      <form className='flex flex-col items-start w-full gap-3 p-4' onSubmit={handleSubmit}>

          <div className='w-full'>
            <p className='mb-2'>Job Title</p>
            <input className='w-full max-w-lg px-3 py-2 border-2 border-gray-300 rounded' type="text" placeholder='Type here' onChange={e => setTitle(e.target.value)} value={title} required />
          </div>

          <div className='w-full max-w-lg'>
            <p className='my-2'>Job Description</p>
            <div ref={editorRef}>

            </div>
          </div>

          <div className='flex flex-col w-full gap-2 sm:flex-row sm:gap-8'>

            <div>
              <p className='mb-2'>Job Category</p>
              <select  className='w-full px-3 py-2 border-2 border-gray-300 rounded' onChange={e => setCategory(e.target.value)} value={category}>
                {JobCategories.map((category,index)=>(
                  <option value={category} key={index}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <p className='mb-2'>Job Location</p>
              <select className='w-full px-3 py-2 border-2 border-gray-300 rounded' onChange={e => setLocation(e.target.value)} value={location}>
                {JobLocations.map((location,index)=>(
                  <option value={location} key={index}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <p className='mb-2'>Job Level</p>
              <select className='w-full px-3 py-2 border-2 border-gray-300 rounded'  onChange={e => setLevel(e.target.value)} value={level}>
                <option value="Beginner level">Beginner level</option>
                <option value="Intermediate level">Intermediate level</option>
                <option value="Senior level">Senior level</option>
              </select>
            </div>
          
          </div>
          <div>
            <p className='mb-2'>Job Salary</p>
            <input min={0} className='w-full px-3 py-2 border-2 border-gray-300 rounded sm:w-[120px]' onChange={e => setSalary(e.target.value)} type="number" placeholder='2500' value={salary} />
          </div>
          

          <button type='submit' disabled={isSubmitting} className='w-28 py-3 mt-4 text-white bg-black rounded hover:bg-gray-800 disabled:bg-gray-400'>
            {isSubmitting ? 'Posting...' : 'ADD'}
          </button>
      </form>
    </div>
  )
}

export default AddJob
