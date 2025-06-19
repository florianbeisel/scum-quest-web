import Editor from "@monaco-editor/react";
import { useState } from "react";
import type { Quest } from "scum-quest-library";
import { QuestSchema } from "scum-quest-library";

interface JsonPreviewProps {
  quest: Quest | null;
  onLoadQuest?: (quest: Quest) => void;
}

export function JsonPreview({ quest, onLoadQuest }: JsonPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState<string>("");

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

  const handleLoadQuest = () => {
    if (!onLoadQuest) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      // Parse the JSON
      const parsedQuest = JSON.parse(editorValue);

      // Validate against the schema
      const validationResult = QuestSchema.safeParse(parsedQuest);

      if (validationResult.success) {
        onLoadQuest(validationResult.data);
        setIsLoading(false);
        setEditorValue("");
      } else {
        setLoadError(`Invalid quest format: ${validationResult.error.message}`);
        setIsLoading(false);
      }
    } catch (error) {
      setLoadError(
        `Invalid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setIsLoading(false);
    }
  };

  const handleStartLoad = () => {
    setIsLoading(true);
    setLoadError(null);
    setEditorValue("// Paste your quest JSON here...");
  };

  const handleCancelLoad = () => {
    setIsLoading(false);
    setLoadError(null);
    setEditorValue("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with actions */}
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">JSON Output</h3>
          <div className="space-x-2">
            {!isLoading ? (
              <>
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
                {onLoadQuest && (
                  <button
                    onClick={handleStartLoad}
                    className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Load Quest
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleLoadQuest}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Load
                </button>
                <button
                  onClick={handleCancelLoad}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Load Error */}
      {loadError && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm">
          {loadError}
        </div>
      )}

      {/* JSON Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={isLoading ? editorValue : jsonString}
          theme="vs-dark"
          options={{
            readOnly: !isLoading,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
          onChange={
            isLoading ? (value) => setEditorValue(value || "") : undefined
          }
        />
      </div>
    </div>
  );
}
