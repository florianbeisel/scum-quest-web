import { useFieldArray, useFormContext, type Control } from "react-hook-form";
import type { QuestFormData } from "./QuestBuilderForm";
import { CONDITION_TYPES } from "scum-quest-library";

interface ConditionBuilderProps {
  control: Control<QuestFormData>;
}

export function ConditionBuilder({ control }: ConditionBuilderProps) {
  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({
    control,
    name: "Conditions",
  });

  const addCondition = () => {
    // Start with an empty condition - let user choose what to add
    appendCondition({
      type: CONDITION_TYPES[0], // Use library's condition type
      sequenceIndex: 0,
      items: [],
      canBeAutoCompleted: false,
      trackingCaption: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Conditions</h3>
        <button
          type="button"
          onClick={addCondition}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Condition
        </button>
      </div>

      {conditionFields.map((field, conditionIndex) => (
        <ConditionEditor
          key={field.id}
          conditionIndex={conditionIndex}
          onRemove={() => removeCondition(conditionIndex)}
          control={control}
        />
      ))}

      {conditionFields.length === 0 && (
        <div className="text-gray-500 text-sm p-4 border-2 border-dashed border-gray-300 rounded text-center">
          No conditions added. Click "Add Condition" to add the first condition.
        </div>
      )}
    </div>
  );
}

interface ConditionEditorProps {
  conditionIndex: number;
  onRemove: () => void;
  control: Control<QuestFormData>;
}

function ConditionEditor({
  conditionIndex,
  onRemove,
  control,
}: ConditionEditorProps) {
  const { register, watch } = useFormContext<QuestFormData>();

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `Conditions.${conditionIndex}.items`,
  });

  // Watch current condition values
  const currentCondition = watch(`Conditions.${conditionIndex}`);
  const hasItems = itemFields.length > 0;

  const addItemSection = () => {
    appendItem({ name: "", amount: 1 });
  };

  return (
    <div className="border border-gray-300 rounded p-4 space-y-4 bg-gray-50">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Condition {conditionIndex + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Remove
        </button>
      </div>

      {/* Condition Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condition Type
        </label>
        <select
          {...register(`Conditions.${conditionIndex}.type`)}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        >
          <option value="Fetch">Fetch Items</option>
          <option value="Elimination">Eliminate NPCs</option>
          <option value="Interaction">Interact with Object</option>
        </select>
      </div>

      {/* Sequence Index */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sequence Index
        </label>
        <input
          {...register(`Conditions.${conditionIndex}.sequenceIndex`, {
            valueAsNumber: true,
          })}
          type="number"
          min="0"
          className="w-full p-2 border border-gray-300 rounded text-sm"
          placeholder="0"
        />
      </div>

      {/* Items Section - only show for Fetch conditions */}
      {currentCondition?.type === "Fetch" && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-sm">Required Items</h5>
            <button
              type="button"
              onClick={addItemSection}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Add Item
            </button>
          </div>

          {itemFields.map((itemField, itemIndex) => (
            <div key={itemField.id} className="flex gap-2 mb-2">
              <input
                {...register(
                  `Conditions.${conditionIndex}.items.${itemIndex}.name`
                )}
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded text-sm"
                placeholder="Item name (e.g., Apple)"
              />
              <input
                {...register(
                  `Conditions.${conditionIndex}.items.${itemIndex}.amount`,
                  { valueAsNumber: true }
                )}
                type="number"
                min="1"
                className="w-20 p-2 border border-gray-300 rounded text-sm"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={() => removeItem(itemIndex)}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}

          {!hasItems && (
            <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded">
              <p className="text-gray-500 text-sm mb-3">
                No items required yet
              </p>
              <button
                type="button"
                onClick={addItemSection}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Add First Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Target Characters Section - only show for Elimination conditions */}
      {currentCondition?.type === "Elimination" && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-sm">Target Characters</h5>
            <button
              type="button"
              onClick={() => appendItem({ name: "", amount: 1 })}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Add Target
            </button>
          </div>

          {itemFields.map((itemField, itemIndex) => (
            <div key={itemField.id} className="flex gap-2 mb-2">
              <input
                {...register(
                  `Conditions.${conditionIndex}.items.${itemIndex}.name`
                )}
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded text-sm"
                placeholder="Character name"
              />
              <input
                {...register(
                  `Conditions.${conditionIndex}.items.${itemIndex}.amount`,
                  { valueAsNumber: true }
                )}
                type="number"
                min="1"
                className="w-20 p-2 border border-gray-300 rounded text-sm"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={() => removeItem(itemIndex)}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Interaction Object Section - only show for Interaction conditions */}
      {currentCondition?.type === "Interaction" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Object to Interact With
          </label>
          <input
            {...register(`Conditions.${conditionIndex}.interactionObject`)}
            type="text"
            className="w-full p-2 border border-gray-300 rounded text-sm"
            placeholder="Object name or ID"
          />
        </div>
      )}

      {/* Common Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Can Be Auto Completed
          </label>
          <input
            {...register(`Conditions.${conditionIndex}.canBeAutoCompleted`)}
            type="checkbox"
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Allow auto-completion</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tracking Caption
          </label>
          <input
            {...register(`Conditions.${conditionIndex}.trackingCaption`)}
            type="text"
            className="w-full p-2 border border-gray-300 rounded text-sm"
            placeholder="Optional tracking text"
          />
        </div>
      </div>
    </div>
  );
}
