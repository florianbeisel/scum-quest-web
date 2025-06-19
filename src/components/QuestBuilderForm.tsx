import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Quest } from "scum-quest-library";
import {
  NPCSchema,
  SkillSchema,
  QuestTierSchema,
  QuestBuilder,
  extractConditionItems,
  extractInteractionObjects,
  isFetchCondition,
  isEliminationCondition,
  isInteractionCondition,
} from "scum-quest-library";
import { RewardBuilder } from "./RewardBuilder";
import { ConditionBuilder } from "./ConditionBuilder";

// Reward form schemas (same as before)
const skillRewardSchema = z.object({
  skill: SkillSchema,
  experience: z.number().min(1),
});

const tradeDealSchema = z.object({
  item: z.string().min(1),
  price: z.number().min(0).optional(),
  amount: z.number().min(1).optional(),
  fame: z.number().min(0).optional(),
  allowExcluded: z.boolean().optional(),
});

const rewardSchema = z.object({
  currencyNormal: z.number().min(0).optional(),
  currencyGold: z.number().min(0).optional(),
  fame: z.number().min(0).optional(),
  skills: z.array(skillRewardSchema).optional(),
  tradeDeals: z.array(tradeDealSchema).optional(),
});

// Condition form schemas
const conditionItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(1),
});

const conditionSchema = z.object({
  type: z.enum(["Fetch", "Elimination", "Interaction"]),
  sequenceIndex: z.number().min(0),
  items: z.array(conditionItemSchema).optional(),
  interactionObject: z.string().optional(),
  canBeAutoCompleted: z.boolean().optional(),
  trackingCaption: z.string().optional(),
});

// Updated main form schema - using library's field names
const questFormSchema = z.object({
  AssociatedNpc: NPCSchema,
  Tier: QuestTierSchema,
  Title: z.string().min(1),
  Description: z.string().min(1),
  TimeLimitHours: z.number().optional(),
  RewardPool: z.array(rewardSchema).min(1),
  Conditions: z.array(conditionSchema).optional(),
});

// Use local types for form data (lowercase field names)
type QuestFormData = z.infer<typeof questFormSchema>;
type RewardFormData = z.infer<typeof rewardSchema>;
type SkillRewardFormData = z.infer<typeof skillRewardSchema>;
type TradeDealFormData = z.infer<typeof tradeDealSchema>;

interface QuestBuilderFormProps {
  onQuestUpdate: (quest: Quest) => void;
  preFilledQuest?: Quest | null;
}

export function QuestBuilderForm({
  onQuestUpdate,
  preFilledQuest,
}: QuestBuilderFormProps) {
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  const methods = useForm<QuestFormData>({
    resolver: zodResolver(questFormSchema),
    defaultValues: {
      AssociatedNpc: "Bartender",
      Tier: QuestTierSchema.options[0]._def.value,
      Title: "",
      Description: "",
      RewardPool: [],
      Conditions: [],
    },
  });

  const {
    control,
    register,
    watch,
    reset,
    formState: { errors },
  } = methods;

  const watchedValues = watch();

  // Populate form with pre-filled quest data
  React.useEffect(() => {
    if (preFilledQuest) {
      // Convert Quest object to form data
      const formData: QuestFormData = {
        AssociatedNpc: (preFilledQuest.AssociatedNpc || "Bartender") as z.infer<
          typeof NPCSchema
        >,
        Tier: preFilledQuest.Tier,
        Title: preFilledQuest.Title,
        Description: preFilledQuest.Description,
        TimeLimitHours: preFilledQuest.TimeLimitHours,
        RewardPool: preFilledQuest.RewardPool.map((reward) => ({
          currencyNormal: reward.CurrencyNormal,
          currencyGold: reward.CurrencyGold,
          fame: reward.Fame,
          skills:
            reward.Skills?.map((skill) => ({
              skill: skill.Skill,
              experience: skill.Experience,
            })) || [],
          tradeDeals:
            reward.TradeDeals?.map((trade) => ({
              item: trade.Item,
              price: trade.Price,
              amount: trade.Amount,
              fame: trade.Fame,
              allowExcluded: trade.AllowExcluded,
            })) || [],
        })),
        Conditions:
          preFilledQuest.Conditions?.map((condition) => {
            if (isFetchCondition(condition)) {
              return {
                type: "Fetch" as const,
                sequenceIndex: condition.SequenceIndex,
                items: extractConditionItems(condition).map((item) => ({
                  name: item,
                  amount: 1, // Default amount, might need to be extracted from condition
                })),
                canBeAutoCompleted: condition.CanBeAutoCompleted,
                trackingCaption: condition.TrackingCaption || "",
              };
            } else if (isEliminationCondition(condition)) {
              return {
                type: "Elimination" as const,
                sequenceIndex: condition.SequenceIndex,
                items:
                  condition.TargetCharacters?.map((char) => ({
                    name: char,
                    amount: condition.Amount || 1,
                  })) || [],
                canBeAutoCompleted: condition.CanBeAutoCompleted,
                trackingCaption: condition.TrackingCaption || "",
              };
            } else if (isInteractionCondition(condition)) {
              return {
                type: "Interaction" as const,
                sequenceIndex: condition.SequenceIndex,
                items: [],
                interactionObject:
                  extractInteractionObjects(condition)[0] || "",
                canBeAutoCompleted: condition.CanBeAutoCompleted,
                trackingCaption: condition.TrackingCaption || "",
              };
            }
            // Fallback for unknown condition types
            const fallbackCondition = condition as {
              SequenceIndex?: number;
              CanBeAutoCompleted?: boolean;
              TrackingCaption?: string;
            };
            return {
              type: "Fetch" as const,
              sequenceIndex: fallbackCondition.SequenceIndex || 0,
              items: [],
              canBeAutoCompleted: fallbackCondition.CanBeAutoCompleted || false,
              trackingCaption: fallbackCondition.TrackingCaption || "",
            };
          }) || [],
      };

      reset(formData);
    }
  }, [preFilledQuest, reset]);

  React.useEffect(() => {
    // Always attempt validation, but collect form completion errors
    const formErrors: string[] = [];

    // Check for required basic properties
    if (!watchedValues.Title) {
      formErrors.push("Title is required");
    }
    if (!watchedValues.Description) {
      formErrors.push("Description is required");
    }
    if (!watchedValues.RewardPool || watchedValues.RewardPool.length === 0) {
      formErrors.push("At least one reward pool is required");
    }

    // If basic requirements are met, try to build the quest
    if (
      watchedValues.Title &&
      watchedValues.Description &&
      watchedValues.RewardPool.length > 0
    ) {
      try {
        // Create a FRESH builder instance each time
        let questBuilder = new QuestBuilder()
          .withNPC(watchedValues.AssociatedNpc)
          .withTier(watchedValues.Tier)
          .withTitle(watchedValues.Title)
          .withDescription(watchedValues.Description);

        // Only add time limit if it's actually provided
        if (watchedValues.TimeLimitHours && watchedValues.TimeLimitHours > 0) {
          questBuilder = questBuilder.withTimeLimit(
            watchedValues.TimeLimitHours
          );
        }

        // Add all rewards - but only if they have actual content
        watchedValues.RewardPool.forEach((reward) => {
          const hasAnything =
            (reward.currencyNormal && reward.currencyNormal > 0) ||
            (reward.currencyGold && reward.currencyGold > 0) ||
            (reward.fame && reward.fame > 0) ||
            (reward.skills && reward.skills.length > 0) ||
            (reward.tradeDeals && reward.tradeDeals.length > 0);

          // Only add the reward if it actually has content
          if (hasAnything) {
            questBuilder = questBuilder.addReward((rewardBuilder) => {
              let builder = rewardBuilder;

              // Add currency only if at least one currency value is provided and > 0
              const hasCurrency =
                (reward.currencyNormal && reward.currencyNormal > 0) ||
                (reward.currencyGold && reward.currencyGold > 0) ||
                (reward.fame && reward.fame > 0);

              if (hasCurrency) {
                builder = builder.currency(
                  reward.currencyNormal && reward.currencyNormal > 0
                    ? reward.currencyNormal
                    : undefined,
                  reward.currencyGold && reward.currencyGold > 0
                    ? reward.currencyGold
                    : undefined,
                  reward.fame && reward.fame > 0 ? reward.fame : undefined
                );
              }

              // Add skills
              reward.skills?.forEach((skill) => {
                if (skill.skill && skill.experience && skill.experience > 0) {
                  builder = builder.addSkill(skill.skill, skill.experience);
                }
              });

              // Add trade deals
              reward.tradeDeals?.forEach((trade) => {
                if (trade.item && trade.item.trim()) {
                  builder = builder.addTradeDeal(trade.item, {
                    Price:
                      trade.price && trade.price > 0 ? trade.price : undefined,
                    Amount:
                      trade.amount && trade.amount > 0
                        ? trade.amount
                        : undefined,
                    Fame:
                      trade.fame && trade.fame >= 0 ? trade.fame : undefined,
                    AllowExcluded: trade.allowExcluded,
                  });
                }
              });

              return builder;
            });
          }
        });

        // Only build the quest if we have at least one reward with content
        const hasValidRewards = watchedValues.RewardPool.some(
          (reward) =>
            (reward.currencyNormal && reward.currencyNormal > 0) ||
            (reward.currencyGold && reward.currencyGold > 0) ||
            (reward.fame && reward.fame > 0) ||
            (reward.skills && reward.skills.length > 0) ||
            (reward.tradeDeals && reward.tradeDeals.length > 0)
        );

        if (hasValidRewards) {
          // Add conditions if they exist
          if (watchedValues.Conditions && watchedValues.Conditions.length > 0) {
            watchedValues.Conditions.forEach((condition) => {
              if (
                condition.type === "Fetch" &&
                condition.items &&
                condition.items.length > 0
              ) {
                questBuilder = questBuilder.addFetchCondition((c) => {
                  let builder = c.withSequenceIndex(condition.sequenceIndex);
                  condition.items?.forEach((item) => {
                    builder = builder.requireItems([item.name], item.amount);
                  });
                  if (condition.canBeAutoCompleted) {
                    builder = builder.autoComplete();
                  }
                  if (condition.trackingCaption) {
                    builder = builder.withCaption(condition.trackingCaption);
                  }
                  return builder;
                });
              } else if (
                condition.type === "Elimination" &&
                condition.items &&
                condition.items.length > 0
              ) {
                questBuilder = questBuilder.addEliminationCondition((c) => {
                  let builder = c.withSequenceIndex(condition.sequenceIndex);
                  condition.items?.forEach((item) => {
                    builder = builder.eliminateTargets(
                      [item.name],
                      item.amount
                    );
                  });
                  if (condition.canBeAutoCompleted) {
                    builder = builder.autoComplete();
                  }
                  if (condition.trackingCaption) {
                    builder = builder.withCaption(condition.trackingCaption);
                  }
                  return builder;
                });
              } else if (
                condition.type === "Interaction" &&
                condition.interactionObject
              ) {
                questBuilder = questBuilder.addInteractionCondition((c) => {
                  let builder = c.withSequenceIndex(condition.sequenceIndex);
                  // For interaction, we might need to use a different approach
                  // since there's no direct requireInteraction method
                  if (condition.canBeAutoCompleted) {
                    builder = builder.autoComplete();
                  }
                  if (condition.trackingCaption) {
                    builder = builder.withCaption(condition.trackingCaption);
                  }
                  return builder;
                });
              }
            });
          } else {
            // Add a default condition if none provided
            questBuilder = questBuilder.addFetchCondition((c) =>
              c.withSequenceIndex(0).requireItems(["Apple"], 1)
            );
          }

          const quest = questBuilder.build();
          onQuestUpdate(quest);
          setValidationErrors([]);
        } else {
          // Clear the quest if no valid rewards
          onQuestUpdate(null as unknown as Quest);
          formErrors.push(
            "At least one reward must have content (currency, skills, or trade deals)"
          );
        }
      } catch (error) {
        // Quest is incomplete, that's OK
        console.log("Quest building error:", error);
        onQuestUpdate(null as unknown as Quest);

        // Capture validation errors
        if (error instanceof Error) {
          formErrors.push(error.message);
        } else if (typeof error === "string") {
          formErrors.push(error);
        } else {
          formErrors.push("Unknown validation error occurred");
        }
      }
    } else {
      onQuestUpdate(null as unknown as Quest);
    }

    // Set validation errors (either form completion errors or library validation errors)
    setValidationErrors(formErrors);
  }, [watchedValues, onQuestUpdate]);

  // Get NPC values from the schema enum
  const npcs = NPCSchema.options;

  // Get tier values from the schema enum
  const questTiers = QuestTierSchema.options.map((opt) => opt._def.value);

  return (
    <FormProvider {...methods}>
      <div className="p-6 space-y-6">
        {/* VALIDATION ERRORS SECTION */}
        <div
          className={`p-4 rounded ${
            validationErrors.length > 0
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          <h3 className="font-semibold mb-2">Validation Status</h3>
          {validationErrors.length > 0 ? (
            <div>
              <p className="mb-2">Validation errors found:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No validation errors - quest is valid!</p>
          )}
        </div>

        {/* BASIC PROPERTIES SECTION */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Basic Properties</h2>

          <div className="space-y-4">
            {/* NPC Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Associated NPC
              </label>
              <select
                {...register("AssociatedNpc")}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {npcs.map((npc) => (
                  <option key={npc} value={npc}>
                    {npc}
                  </option>
                ))}
              </select>
              {errors.AssociatedNpc && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.AssociatedNpc.message}
                </p>
              )}
            </div>

            {/* Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier
              </label>
              <select
                {...register("Tier", { valueAsNumber: true })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {questTiers.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
              {errors.Tier && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Tier.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                {...register("Title")}
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quest title..."
              />
              {errors.Title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("Description")}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quest description..."
              />
              {errors.Description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Description.message}
                </p>
              )}
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (hours) - Optional
              </label>
              <input
                {...register("TimeLimitHours", { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.5"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="24"
              />
              {errors.TimeLimitHours && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.TimeLimitHours.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* REWARDS SECTION */}
        <RewardBuilder control={control} />

        {/* CONDITIONS SECTION */}
        <ConditionBuilder control={control} />
      </div>
    </FormProvider>
  );
}

// Export the types for RewardBuilder
export type {
  QuestFormData,
  RewardFormData,
  SkillRewardFormData,
  TradeDealFormData,
};
