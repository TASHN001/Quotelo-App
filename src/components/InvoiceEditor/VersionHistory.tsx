import { History, RotateCcw, FileText } from 'lucide-react';
import { ds } from '../../lib/designSystem';
import type { DocumentVersion } from '../../lib/types';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  onRestore: (versionId: string) => void;
}

export function VersionHistory({ versions, onRestore }: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className="pt-4 text-center py-8">
        <History className="w-10 h-10 text-[#c7c7cc] mx-auto mb-3" />
        <p className={`${ds.callout} text-[#8e8e93]`}>No version history yet</p>
        <p className={`${ds.footnote} text-[#c7c7cc] mt-1`}>
          Versions are saved automatically when you save the document
        </p>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-2">
      <p className={`${ds.footnote} text-[#8e8e93] mb-3`}>
        Last 5 versions are kept. Restore any version to revert changes.
      </p>

      {versions.map((version, index) => {
        const date = new Date(version.created_at);
        const isLatest = index === 0;

        return (
          <div
            key={version.id}
            className={`flex items-center gap-3 p-3 rounded-xl ${ds.transition} ${
              isLatest ? 'bg-[#fff3e8] border border-[#f97316]/20' : 'bg-[#f2f2f7]'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isLatest ? 'bg-[#f97316]' : 'bg-white'
            }`}>
              <FileText className={`w-4 h-4 ${isLatest ? 'text-white' : 'text-[#8e8e93]'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`${ds.callout} font-semibold ${isLatest ? 'text-[#f97316]' : 'text-black'}`}>
                  Version {version.version_number}
                </span>
                {isLatest && (
                  <span className={`px-1.5 py-0.5 bg-[#f97316] text-white ${ds.caption} rounded-full`}>
                    Current
                  </span>
                )}
              </div>
              <p className={`${ds.footnote} text-[#8e8e93]`}>
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {!isLatest && (
              <button
                onClick={() => onRestore(version.id)}
                className={`flex items-center gap-1 px-3 py-1.5 ${ds.callout} text-[#8e8e93] hover:text-[#f97316] hover:bg-[#fff3e8] rounded-xl ${ds.transition}`}
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
