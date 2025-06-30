import React from "react";

/**
 * Responsive and attractive confirmation dialog for delete/email actions.
 * Props:
 * - open: boolean (show/hide dialog)
 * - title: string
 * - message: string
 * - confirmText: string (e.g., "Delete")
 * - cancelText: string (e.g., "Cancel")
 * - onConfirm: function
 * - onCancel: function
 */
export default function ConfirmDialog({ open, title, message, confirmText = "OK", cancelText = "Cancel", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-8 mx-2 flex flex-col items-center border-2 border-blue-400 bg-[#182234] relative animate-fadein"
        style={{ boxShadow: '0 0 2px 4px #38bdf8, 0 2px 1px #000a inset' }}
      >
        <div className="text-3xl font-bold text-blue-400 mb-3 w-full text-left drop-shadow">
          {title}
        </div>
        <div className="text-lg font-semibold text-white text-left w-full mb-4">
          {typeof message === 'string' ? (
            message.split('\n').map((line, idx) =>
              idx === 1 ? (
                <span key={idx} className="block text-pink-400 font-bold text-xl mb-1">{line}</span>
              ) : (
                <span key={idx} className="block mb-1">{line}</span>
              )
            )
          ) : (
            message
          )}
        </div>
        <div className="flex w-full gap-4 mt-2 justify-center">
          <button
            className="flex-1 py-2 rounded-lg border-2 border-blue-400 bg-transparent text-blue-400 font-bold text-lg transition-all hover:bg-blue-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={onCancel}
            style={{ minWidth: 120 }}
          >
            {cancelText}
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={onConfirm}
            style={{ minWidth: 140 }}
          >
            {confirmText}
          </button>
        </div>
        <div className="absolute -inset-0.5 pointer-events-none rounded-2xl" style={{ boxShadow: '0 0 24px 4px #38bdf8' }} />
      </div>
    </div>
  );
}

