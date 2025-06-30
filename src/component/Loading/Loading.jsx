import React from 'react';

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-xl font-semibold text-gray-700">Loading...</p>
    </div>
  );
};

export default Loading; 