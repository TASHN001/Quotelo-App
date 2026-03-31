import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataPrivacySections } from '../content/dataPrivacy';

export function DataPrivacyScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setCurrentScreen('profile')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">
            Data & Privacy
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-8 max-w-2xl mx-auto">
          {dataPrivacySections.map((section, index) => (
            <div key={index} className="mb-8 last:mb-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
