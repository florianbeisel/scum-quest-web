import Editor from "@monaco-editor/react";
import type { Quest } from "scum-quest-library";

interface JsonPreviewProps {
  quest: Quest | null;
}

export function JsonPreview({ quest }: JsonPreviewProps) {
  const jsonString = quest
    ? JSON.stringify(quest, null, 2)
    : "// Quest will appear here as you build it...";

  const handleCopyToClipboard = () => {
    if (quest) {
      navigator.clipboard.writeText(JSON.stringify(quest, null, 2));
    }
  };

  const handleDownload = () => {
    if (quest) {
      const blob = new Blob([JSON.stringify(quest, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        quest.Title?.replace(/[^a-zA-Z0-9]/g, "_") || "quest"
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with actions */}
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">JSON Output</h3>
          <div className="space-x-2">
            <button
              onClick={handleCopyToClipboard}
              disabled={!quest}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Copy JSON
            </button>
            <button
              onClick={handleDownload}
              disabled={!quest}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Download
            </button>
          </div>
        </div>
      </div>

      {/* JSON Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={jsonString}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
