const ACTIVE_CATEGORIES_CACHE_KEY = "categories:active";
const ACTIVE_CATEGORIES_CACHE_TTL_MILLISECONDS = 60 * 1000;

export interface CachedActiveCategory {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface ActiveCategoriesCacheEntry {
  value: CachedActiveCategory[];
  expiresAt: number;
}

const categoryCache = new Map<string, ActiveCategoriesCacheEntry>();

function copyCategories(
  categories: readonly CachedActiveCategory[],
): CachedActiveCategory[] {
  return categories.map((category) => ({ ...category }));
}

export function getActiveCategoriesCache(): CachedActiveCategory[] | null {
  const entry = categoryCache.get(ACTIVE_CATEGORIES_CACHE_KEY);

  if (entry === undefined) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    categoryCache.delete(ACTIVE_CATEGORIES_CACHE_KEY);
    return null;
  }

  return copyCategories(entry.value);
}

export function setActiveCategoriesCache(
  categories: readonly CachedActiveCategory[],
): void {
  categoryCache.set(ACTIVE_CATEGORIES_CACHE_KEY, {
    value: copyCategories(categories),
    expiresAt: Date.now() + ACTIVE_CATEGORIES_CACHE_TTL_MILLISECONDS,
  });
}

export function invalidateActiveCategoriesCache(): void {
  categoryCache.delete(ACTIVE_CATEGORIES_CACHE_KEY);
}
