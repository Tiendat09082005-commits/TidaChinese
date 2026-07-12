import React from 'react'

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  )
}
