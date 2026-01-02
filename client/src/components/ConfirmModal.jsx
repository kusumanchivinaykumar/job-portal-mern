import React from 'react'

const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]'>
      <div className='bg-white rounded-lg p-6 w-96 shadow-lg transform transition-all'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title || 'Confirm Action'}</h3>
        <p className='text-gray-600 mb-6'>{message || 'Are you sure you want to proceed?'}</p>
        
        <div className='flex justify-end gap-3'>
          <button 
            onClick={onCancel}
            className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-300 transition-colors'
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal