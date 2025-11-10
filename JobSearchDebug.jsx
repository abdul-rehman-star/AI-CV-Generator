import React from "react";

const JobSearchDebug = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Debug: JobSearch Component</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-green-600 text-lg">✅ Component is rendering successfully!</p>
        <p className="text-gray-600 mt-2">If you can see this, the basic React component is working.</p>
        <p className="text-gray-600 mt-2">The issue might be with:</p>
        <ul className="list-disc list-inside mt-2 text-gray-600">
          <li>API calls not working</li>
          <li>Complex CSS classes not loading</li>
          <li>JavaScript errors in the full component</li>
          <li>Missing dependencies</li>
        </ul>
        
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-bold text-blue-800">Next Steps:</h3>
          <ol className="list-decimal list-inside text-blue-700 mt-2">
            <li>Check browser console for errors</li>
            <li>Verify API is running on backend</li>
            <li>Check if Tailwind CSS is properly loaded</li>
            <li>Try the simple version first</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default JobSearchDebug;

