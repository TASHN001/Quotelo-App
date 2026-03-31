import { ArrowLeft, Sun, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function AppearanceScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-white flex flex-col transition-colors">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setCurrentScreen('app-settings')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
            Appearance
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Theme</h2>
          <div className="w-full bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500 shadow-sm">
                  <Sun className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Light</div>
                  <div className="text-sm text-gray-500">Light mode theme</div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
