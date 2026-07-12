import React from 'react'

export default function DataTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border-b p-2">Header</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-b p-2">Row Cell</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
