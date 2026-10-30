import { getPlatformDirectory } from "./api/index.js";

// Temporary compatibility with deployed servers predating q. Data stays in this
// mounted administrator view only; bounded pagination never returns partial matches.
export function createDirectorySearchLoader(user) {
  const cache = new Map();
  let legacy = false;
  const match = (person, q) =>
    `${person.name ?? ""} ${person.email}`
      .normalize("NFKC")
      .toLowerCase()
      .includes(q.normalize("NFKC").toLowerCase());
  return {
    async get(role, after, product, q = "") {
      if (!q) return getPlatformDirectory(user, role, after, product);
      if (!legacy) {
        try {
          return await getPlatformDirectory(user, role, after, product, q);
        } catch (error) {
          if (error.status !== 400) throw error;
          legacy = true;
        }
      }
      const key = JSON.stringify([role, product]);
      if (!cache.has(key))
        cache.set(
          key,
          (async () => {
            let page = await getPlatformDirectory(
              user,
              role,
              undefined,
              product,
            );
            const first = page,
              items = [...page.items],
              seen = new Set();
            while (page.nextCursor) {
              if (seen.has(page.nextCursor) || items.length >= 1000)
                throw Object.assign(new Error("Search capacity exceeded"), {
                  status: 413,
                });
              seen.add(page.nextCursor);
              page = await getPlatformDirectory(
                user,
                role,
                page.nextCursor,
                product,
              );
              items.push(...page.items);
            }
            if (items.length > 1000)
              throw Object.assign(new Error("Search capacity exceeded"), {
                status: 413,
              });
            return { ...first, items, nextCursor: null };
          })().catch((error) => {
            cache.delete(key);
            throw error;
          }),
        );
      const data = await cache.get(key);
      return {
        ...data,
        items: data.items.filter((person) => match(person, q)),
      };
    },
    clear() {
      cache.clear();
    },
  };
}
