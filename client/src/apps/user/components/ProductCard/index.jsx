import React from 'react'

export default function ProductCard() {
  return (
    <div className="border p-4 rounded shadow-sm bg-white">
      <h3>Product Title</h3>
      <p>Price: $0.00</p>
      <button className="bg-blue-500 text-white px-4 py-2 mt-2 rounded">Add to Cart</button>
    </div>
  )
}
