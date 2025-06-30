import React from "react";

export default function SalarySlipModal({ isOpen, onClose, onDownload, children, showDownloadPopup, onCloseDownloadPopup }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-xl min-w-[350px] relative flex flex-col max-h-[90vh]">
        {/* Download Success Popup Overlay */}
        {showDownloadPopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-xs w-full p-6 flex flex-col items-center">
              <span className="text-green-600 text-4xl mb-2">⬇️</span>
              <div className="text-lg font-semibold mb-4 text-center">PDF downloaded successfully</div>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold shadow"
                onClick={onCloseDownloadPopup}
              >
                OK
              </button>
            </div>
          </div>
        )}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold z-10"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {/* Scrollable content area */}
        <div className="overflow-y-auto p-6 pb-2 flex-1">
          {children}
        </div>
        {/* Sticky footer for buttons */}
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-800 p-4 flex justify-end gap-4 rounded-b-lg border-t border-gray-200 dark:border-slate-700 z-20">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold shadow"
            onClick={onDownload}
            disabled={!!showDownloadPopup}
          >
            Download
          </button>
          <button
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-semibold shadow"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
