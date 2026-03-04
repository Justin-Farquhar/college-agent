'use client';

type SchoolSearchFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  stateFilter: string;
  onStateFilterChange: (value: string) => void;
  isPublicFilter: string;
  onIsPublicFilterChange: (value: string) => void;
  onSearch?: () => void;
};

const US_STATES = [
  '', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

export function SchoolSearchFilters({
  searchTerm,
  onSearchTermChange,
  stateFilter,
  onStateFilterChange,
  isPublicFilter,
  onIsPublicFilterChange,
  onSearch,
}: SchoolSearchFiltersProps) {
  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Search & filters
          </h2>
          <p className="text-xs text-slate-400">
            Search by name or filter by state and type to find schools.
          </p>
        </div>
      </div>

      <form
        className="grid gap-3 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch?.();
        }}
      >
        <input
          className="input"
          placeholder="Search by school name"
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
        <select
          className="input"
          value={stateFilter}
          onChange={(e) => onStateFilterChange(e.target.value)}
        >
          <option value="">All states</option>
          {US_STATES.filter(Boolean).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={isPublicFilter}
          onChange={(e) => onIsPublicFilterChange(e.target.value)}
        >
          <option value="">Public & private</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        {onSearch && (
          <button type="submit" className="btn">
            Search
          </button>
        )}
      </form>
    </section>
  );
}
