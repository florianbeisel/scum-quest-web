import { useFieldArray, useFormContext, type Control } from "react-hook-form";
import type { QuestFormData } from "./QuestBuilderForm";
import { SkillSchema } from "scum-quest-library";

interface RewardBuilderProps {
  control: Control<QuestFormData>;
}

export function RewardBuilder({ control }: RewardBuilderProps) {
  const {
    fields: rewardFields,
    append: appendReward,
    remove: removeReward,
  } = useFieldArray({
    control,
    name: "RewardPool",
  });

  const addReward = () => {
    // Start with an empty reward - let user choose what to add
    appendReward({
      currencyNormal: undefined,
      currencyGold: undefined,
      fame: undefined,
      skills: [],
      tradeDeals: [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rewards</h3>
        <button
          type="button"
          onClick={addReward}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Reward Pool
        </button>
      </div>

      {rewardFields.map((field, rewardIndex) => (
        <RewardPoolEditor
          key={field.id} // This is crucial - use field.id, not index
          rewardIndex={rewardIndex}
          onRemove={() => removeReward(rewardIndex)}
          control={control}
        />
      ))}

      {rewardFields.length === 0 && (
        <div className="text-gray-500 text-sm p-4 border-2 border-dashed border-gray-300 rounded text-center">
          No rewards added. Click "Add Reward Pool" to add the first reward.
        </div>
      )}
    </div>
  );
}

interface RewardPoolEditorProps {
  rewardIndex: number;
  onRemove: () => void;
  control: Control<QuestFormData>;
}

function RewardPoolEditor({
  rewardIndex,
  onRemove,
  control,
}: RewardPoolEditorProps) {
  const { register, watch, setValue } = useFormContext<QuestFormData>();

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: `RewardPool.${rewardIndex}.skills`,
  });

  const {
    fields: tradeFields,
    append: appendTrade,
    remove: removeTrade,
  } = useFieldArray({
    control,
    name: `RewardPool.${rewardIndex}.tradeDeals`,
  });

  // Watch current reward values
  const currentReward = watch(`RewardPool.${rewardIndex}`);
  const hasCurrency =
    (currentReward?.currencyNormal !== undefined &&
      currentReward.currencyNormal !== null) ||
    (currentReward?.currencyGold !== undefined &&
      currentReward.currencyGold !== null) ||
    (currentReward?.fame !== undefined && currentReward.fame !== null);
  const hasSkills = skillFields.length > 0;
  const hasTradeDeals = tradeFields.length > 0;

  // Get skill values from the schema enum
  const skills = SkillSchema.options;

  const addCurrencySection = () => {
    // Set a default currency value to make the currency section appear
    setValue(`RewardPool.${rewardIndex}.currencyNormal`, 1);
  };

  return (
    <div className="border border-gray-300 rounded p-4 space-y-4 bg-gray-50">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Reward Pool {rewardIndex + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Remove
        </button>
      </div>

      {/* Add reward type buttons if no content */}
      {!hasCurrency && !hasSkills && !hasTradeDeals && (
        <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500 text-sm mb-3">Choose reward type:</p>
          <div className="space-x-2">
            <button
              type="button"
              onClick={addCurrencySection}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Add Currency/Fame
            </button>
            <button
              type="button"
              onClick={() => appendSkill({ skill: skills[0], experience: 50 })}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Add Skill
            </button>
            <button
              type="button"
              onClick={() =>
                appendTrade({ item: "", price: undefined, amount: 1 })
              }
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Add Trade Deal
            </button>
          </div>
        </div>
      )}

      {/* Currency Section - only show if has content */}
      {hasCurrency && (
        <div>
          <h5 className="font-medium text-sm mb-2">Currency & Fame</h5>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Normal Currency
              </label>
              <input
                {...register(`RewardPool.${rewardIndex}.currencyNormal`, {
                  valueAsNumber: true,
                })}
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Gold Currency
              </label>
              <input
                {...register(`RewardPool.${rewardIndex}.currencyGold`, {
                  valueAsNumber: true,
                })}
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fame Points
              </label>
              <input
                {...register(`RewardPool.${rewardIndex}.fame`, {
                  valueAsNumber: true,
                })}
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Skills Section - only show if has content */}
      {hasSkills && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-sm">Skill Rewards</h5>
            <button
              type="button"
              onClick={() => appendSkill({ skill: skills[0], experience: 50 })}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Add Skill
            </button>
          </div>

          {skillFields.map((skillField, skillIndex) => (
            <div key={skillField.id} className="flex gap-2 mb-2">
              <select
                {...register(
                  `RewardPool.${rewardIndex}.skills.${skillIndex}.skill`
                )}
                className="flex-1 p-2 border border-gray-300 rounded text-sm"
              >
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <input
                {...register(
                  `RewardPool.${rewardIndex}.skills.${skillIndex}.experience`,
                  { valueAsNumber: true }
                )}
                type="number"
                min="1"
                className="w-20 p-2 border border-gray-300 rounded text-sm"
                placeholder="XP"
              />
              <button
                type="button"
                onClick={() => removeSkill(skillIndex)}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trade Deals Section - only show if has content */}
      {hasTradeDeals && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-sm">Trade Deals</h5>
            <button
              type="button"
              onClick={() =>
                appendTrade({ item: "", price: undefined, amount: 1 })
              }
              className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
            >
              Add Trade Deal
            </button>
          </div>

          {tradeFields.map((tradeField, tradeIndex) => (
            <div
              key={tradeField.id}
              className="border border-gray-200 rounded p-3 mb-2 bg-white"
            >
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    {...register(
                      `RewardPool.${rewardIndex}.tradeDeals.${tradeIndex}.item`
                    )}
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="e.g. Weapon_M9"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    {...register(
                      `RewardPool.${rewardIndex}.tradeDeals.${tradeIndex}.price`,
                      { valueAsNumber: true }
                    )}
                    type="number"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    {...register(
                      `RewardPool.${rewardIndex}.tradeDeals.${tradeIndex}.amount`,
                      { valueAsNumber: true }
                    )}
                    type="number"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fame Req.
                  </label>
                  <input
                    {...register(
                      `RewardPool.${rewardIndex}.tradeDeals.${tradeIndex}.fame`,
                      { valueAsNumber: true }
                    )}
                    type="number"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeTrade(tradeIndex)}
                    className="w-full px-2 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add more buttons if already has content */}
      {(hasCurrency || hasSkills || hasTradeDeals) && (
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          {!hasCurrency && (
            <button
              type="button"
              onClick={addCurrencySection}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              + Currency
            </button>
          )}
          {!hasSkills && (
            <button
              type="button"
              onClick={() => appendSkill({ skill: skills[0], experience: 50 })}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              + Skill
            </button>
          )}
          {!hasTradeDeals && (
            <button
              type="button"
              onClick={() =>
                appendTrade({ item: "", price: undefined, amount: 1 })
              }
              className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
            >
              + Trade Deal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
