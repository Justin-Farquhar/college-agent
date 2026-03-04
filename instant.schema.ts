import { i } from '@instantdb/react';

const appSchema = i.schema({
  entities: {
    schools: i.entity({
      name: i.string().indexed(),
      state: i.string().indexed(),
      isPublic: i.boolean(),
      netPrice: i.number(), // Average net price (e.g. AVG_NET_PRICE)
      medianDebt: i.number(), // Median debt (e.g. DEBT_MDN)
      completionRate: i.number(), // Completion rate (e.g. C150_4, percentage 0-100)
      earlyCareerEarnings: i.number(), // Earnings shortly after graduation (e.g. MD_EARN_WNE_P10)
      earningsAt10Yrs: i.number(), // Earnings at 10 years (e.g. MD_EARN_WNE_P10)
      institutionId: i.string().optional(), // College Scorecard institutional ID
    }),
    comparisons: i.entity({
      name: i.string(),
      notes: i.string().optional(),
      createdAt: i.date(),
      // store references as string IDs for now
      userId: i.string(),
    }),
    comparison_schools: i.entity({
      comparisonId: i.string(),
      schoolId: i.string(),
      order: i.number(),
    }),
    saved_schools: i.entity({
      userId: i.string(),
      schoolId: i.string(),
      notes: i.string().optional(),
    }),
  },
});

export default appSchema;

