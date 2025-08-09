// src/lib/filters.ts
// -----------------------------------------------------
// Helpers that translate URL query params → Prisma
// `where` clauses for <Product> queries.
// -----------------------------------------------------

// src/lib/filters.ts
import type { Prisma } from "@prisma/client";

// …rest of the file
// <- works with the default `@prisma/client`
//    If you changed `generator client { output = ... }`
//    adjust the path accordingly, e.g.
//    import type { Prisma } from '@/generated/prisma';

/* ──────────── util helpers ──────────── */

function getStr(
    params: URLSearchParams | Record<string, string | string[]>,
    key: string
): string | undefined {
    return typeof (params as URLSearchParams).get === 'function'
        ? (params as URLSearchParams).get(key) ?? undefined
        : (params as Record<string, any>)[key];
}

function getNum(
    params: URLSearchParams | Record<string, string | string[]>,
    key: string
): number | undefined {
    const v = getStr(params, key);
    return v != null && v.trim() !== '' ? Number(v) : undefined;
}

function getBool(
    params: URLSearchParams | Record<string, string | string[]>,
    key: string
): boolean | undefined {
    const v = getStr(params, key);
    if (v == null) return undefined;
    return ['1', 'true', 'yes'].includes(v.toLowerCase());
}

function getInt(
    params: URLSearchParams | Record<string, string | string[]>,
    key: string
): number | undefined {
    const n = getNum(params, key);
    return n != null && Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/* ───────────── public API ───────────── */

/**
 * Build a Prisma `ProductWhereInput` object
 * from the caller's query-string parameters.
 *
 * Supported params
 *  ────────────────
 *  q        Full-text search (name, insensitive)
 *  search   Full-text search (name, insensitive) - alias for 'q'
 *  cat      Category id          (number)
 *  min      Minimum price        (decimal)
 *  max      Maximum price        (decimal)
 *  inStock  1 / true / yes → qtyInStock > 0
 */
export function buildProductWhere(
    params: URLSearchParams | Record<string, string | string[]>
): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    // Exclude archived by default unless explicitly included
    const incArchived =
        typeof (params as URLSearchParams).get === 'function'
            ? (params as URLSearchParams).get('includeArchived')
            : (params as Record<string, any>)['includeArchived'];
    if (!incArchived || !['1', 'true', 'yes'].includes(String(incArchived).toLowerCase())) {
        where.archived = false;
    }

    /* 1️⃣  Full-text search */
    const q = getStr(params, 'q') || getStr(params, 'search');
    if (q) {
        where.OR = [{ name: { contains: q, mode: 'insensitive' } }];
    }

    /* 2️⃣  Category filter */
    const catId = getInt(params, 'cat');
    if (catId !== undefined) where.categoryId = catId;

    /* 3️⃣  Price range */
    const min = getNum(params, 'min');
    const max = getNum(params, 'max');
    if (min != null || max != null) {
        where.price = {};
        if (min != null) where.price.gte = min;
        if (max != null) where.price.lte = max;
    }

    /* 4️⃣  Availability */
    const onlyInStock = getBool(params, 'inStock');
    if (onlyInStock != null) {
        where.qtyInStock = onlyInStock ? { gt: 0 } : 0;
    }

    return where;
}
