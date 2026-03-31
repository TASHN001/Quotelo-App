import { History, RotateCcw, FileText } from 'lucide-react';
import type { DocumentVersion } from '../../lib/types';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  onRestore: (versionId: string) => void;
}

export function VersionHistory({ versions, onRestore }: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className="pt-4 text-center py-8">
        <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No version history yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Versions are saved automatically when you save the document
        </p>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-2">
      <p className="text-xs text-gray-500 mb-3">
        Last 5 versions are kept. Restore any version to revert changes.
      </p>

      {versions.map((version, index) => {
        const date = new Date(version.created_at);
        const isLatest = index === 0;

        return (
          <div
            key={version.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isLatest ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isLatest ? 'bg-orange-100' : 'bg-gray-200'
            }`}>
              <FileText className={`w-4 h-4 ${isLatest ? 'text-orange-600' : 'text-gray-500'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isLatest ? 'text-orange-700' : 'text-gray-700'}`}>
                  Version {version.version_number}
                </span>
                {isLatest && (
                  <span className="px-1.5 py-0.5 bg-orange-200 text-orange-700 text-[10px] font-medium rounded">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {!isLatest && (
              <button
                onClick={() => onRestore(version.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
