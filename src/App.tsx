import { useState } from "react";
import { QuestBuilderForm } from "./components/QuestBuilderForm.tsx";
import { JsonPreview } from "./components/JsonPreview.tsx";
import type { Quest } from "scum-quest-library";

function App() {
  const [quest, setQuest] = useState<Quest | null>(null);

  const handleQuestUpdate = (updatedQuest: Quest) => {
    setQuest(updatedQuest);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold">SCUM Quest Builder</h1>
      </header>

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane - Form */}
        <div className="w-1/2 border-r border-gray-300 overflow-y-auto">
          <QuestBuilderForm onQuestUpdate={handleQuestUpdate} />
        </div>

        {/* Right pane - JSON output */}
        <div className="w-1/2 overflow-y-auto">
          <JsonPreview quest={quest} />
        </div>
      </div>
    </div>
  );
}

export default App;
