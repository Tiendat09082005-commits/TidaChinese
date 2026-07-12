import React from 'react'

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center bg-white shadow p-4">
      <div>Brand Logo</div>
      <div className="flex gap-4">
        <span>Home</span>
        <span>Cart</span>
      </div>
    </nav>
  )
}
