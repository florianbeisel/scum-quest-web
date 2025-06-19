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
} from "scum-quest-library";
import { RewardBuilder } from "./RewardBuilder";

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

// Updated main form schema
const questFormSchema = z.object({
  npc: NPCSchema,
  tier: QuestTierSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  timeLimit: z.number().optional(),
  rewards: z.array(rewardSchema).min(1),
});

type QuestFormData = z.infer<typeof questFormSchema>;
type RewardFormData = z.infer<typeof rewardSchema>;
type SkillRewardFormData = z.infer<typeof skillRewardSchema>;
type TradeDealFormData = z.infer<typeof tradeDealSchema>;

interface QuestBuilderFormProps {
  onQuestUpdate: (quest: Quest) => void;
}

export function QuestBuilderForm({ onQuestUpdate }: QuestBuilderFormProps) {
  const methods = useForm<QuestFormData>({
    resolver: zodResolver(questFormSchema),
    defaultValues: {
      npc: "Bartender",
      tier: QuestTierSchema.options[0]._def.value,
      title: "",
      description: "",
      rewards: [],
    },
  });

  const {
    register,
    watch,
    control,
    formState: { errors },
  } = methods;

  // Watch for changes and update quest in real-time
  const watchedValues = watch();

  React.useEffect(() => {
    if (
      watchedValues.title &&
      watchedValues.description &&
      watchedValues.rewards.length > 0
    ) {
      try {
        // Create a FRESH builder instance each time
        let questBuilder = new QuestBuilder()
          .withNPC(watchedValues.npc)
          .withTier(watchedValues.tier)
          .withTitle(watchedValues.title)
          .withDescription(watchedValues.description);

        // Only add time limit if it's actually provided
        if (watchedValues.timeLimit && watchedValues.timeLimit > 0) {
          questBuilder = questBuilder.withTimeLimit(watchedValues.timeLimit);
        }

        // Add all rewards - but only if they have actual content
        watchedValues.rewards.forEach((reward) => {
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
        const hasValidRewards = watchedValues.rewards.some(
          (reward) =>
            (reward.currencyNormal && reward.currencyNormal > 0) ||
            (reward.currencyGold && reward.currencyGold > 0) ||
            (reward.fame && reward.fame > 0) ||
            (reward.skills && reward.skills.length > 0) ||
            (reward.tradeDeals && reward.tradeDeals.length > 0)
        );

        if (hasValidRewards) {
          const quest = questBuilder
            // Add a default condition for now
            .addFetchCondition((c) =>
              c.withSequenceIndex(0).requireItems(["Apple"], 1)
            )
            .build();

          onQuestUpdate(quest);
        } else {
          // Clear the quest if no valid rewards
          onQuestUpdate(null as unknown as Quest);
        }
      } catch (error) {
        // Quest is incomplete, that's OK
        console.log("Quest building error:", error);
        onQuestUpdate(null as unknown as Quest);
      }
    } else {
      onQuestUpdate(null as unknown as Quest);
    }
  }, [watchedValues, onQuestUpdate]);

  // Get NPC values from the schema enum
  const npcs = NPCSchema.options;

  // Get tier values from the schema enum
  const questTiers = QuestTierSchema.options.map((opt) => opt._def.value);

  return (
    <FormProvider {...methods}>
      <div className="p-6 space-y-6">
        <div className="bg-red-500 text-white p-4 rounded">
          This should be red with white text if Tailwind is working
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
                {...register("npc")}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {npcs.map((npc) => (
                  <option key={npc} value={npc}>
                    {npc}
                  </option>
                ))}
              </select>
              {errors.npc && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.npc.message}
                </p>
              )}
            </div>

            {/* Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier
              </label>
              <select
                {...register("tier", { valueAsNumber: true })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {questTiers.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
              {errors.tier && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.tier.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                {...register("title")}
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quest title..."
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quest description..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (hours) - Optional
              </label>
              <input
                {...register("timeLimit", { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.5"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="24"
              />
              {errors.timeLimit && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.timeLimit.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* REWARDS SECTION */}
        <RewardBuilder control={control} />

        {/* CONDITIONS SECTION - Placeholder for now */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Conditions</h3>
          <p className="text-gray-500 text-sm">
            Coming soon - condition builder
          </p>
        </div>
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
