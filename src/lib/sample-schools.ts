/**
 * Sample schools so you can try the app before seeding the full College Scorecard data.
 * These use IDs like "sample-1"; the app shows them when the DB has no (or few) schools.
 */

export const SAMPLE_SCHOOL_IDS = ['sample-1', 'sample-2', 'sample-3', 'sample-4'] as const;

export type SampleSchool = {
  id: string;
  name: string;
  state: string;
  isPublic: boolean;
  netPrice: number;
  medianDebt: number;
  completionRate: number;
  earlyCareerEarnings: number;
  earningsAt10Yrs: number;
  institutionId?: string | null;
};

export const SAMPLE_SCHOOLS: SampleSchool[] = [
  {
    id: 'sample-1',
    name: 'University of Delaware',
    state: 'DE',
    isPublic: true,
    netPrice: 18500,
    medianDebt: 22000,
    completionRate: 82,
    earlyCareerEarnings: 58000,
    earningsAt10Yrs: 72000,
    institutionId: '131496',
  },
  {
    id: 'sample-2',
    name: 'Rutgers University–New Brunswick',
    state: 'NJ',
    isPublic: true,
    netPrice: 16500,
    medianDebt: 20000,
    completionRate: 85,
    earlyCareerEarnings: 62000,
    earningsAt10Yrs: 78000,
    institutionId: '186380',
  },
  {
    id: 'sample-3',
    name: 'Penn State University Park',
    state: 'PA',
    isPublic: true,
    netPrice: 24000,
    medianDebt: 27000,
    completionRate: 88,
    earlyCareerEarnings: 61000,
    earningsAt10Yrs: 85000,
    institutionId: '214777',
  },
  {
    id: 'sample-4',
    name: 'Temple University',
    state: 'PA',
    isPublic: true,
    netPrice: 22000,
    medianDebt: 25000,
    completionRate: 75,
    earlyCareerEarnings: 52000,
    earningsAt10Yrs: 68000,
    institutionId: '216278',
  },
];

export function getSampleSchool(id: string): SampleSchool | undefined {
  return SAMPLE_SCHOOLS.find((s) => s.id === id);
}

export function isSampleSchoolId(id: string): boolean {
  return SAMPLE_SCHOOL_IDS.includes(id as (typeof SAMPLE_SCHOOL_IDS)[number]);
}
