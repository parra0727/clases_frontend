import { appConfig } from '../config';
import { loadProducts } from '../utils/productsStorage';

import { requestJson } from './http';

const normalizeId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const slugify = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const extractCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const normalizeCategory = (category, parentCategory = null) => {
  const name = String(category?.name ?? category?.categoryName ?? '').trim() || 'Sin categoría';
  const id = normalizeId(category?.id ?? category?.categoryId);
  const parentId =
    category?.parentId === null || category?.parentId === undefined
      ? (parentCategory?.id ?? null)
      : normalizeId(category.parentId);
  const parentName = String(category?.parentName ?? parentCategory?.name ?? '').trim() || null;
  const subcategories = extractCollection(category?.subcategories).map((subcategory) =>
    normalizeCategory(subcategory, { id, name })
  );

  return {
    id,
    parentId,
    parentName,
    name,
    slug: String(category?.slug ?? slugify(name)),
    isRoot: Boolean(category?.isRoot ?? !parentId),
    subcategoriesCount: Number.isFinite(Number(category?.subcategoriesCount))
      ? Number(category.subcategoriesCount)
      : subcategories.length,
    productsCount: Number.isFinite(Number(category?.productsCount))
      ? Number(category.productsCount)
      : 0,
    subcategories,
  };
};

const flattenCategories = (categories) =>
  categories.flatMap((category) => [
    category,
    ...flattenCategories(Array.isArray(category.subcategories) ? category.subcategories : []),
  ]);

const buildLocalCategoriesTree = () => {
  const categoriesByName = new Map();

  for (const product of loadProducts()) {
    const categoryName = String(product?.categoryName ?? product?.category ?? '').trim();

    if (!categoryName) {
      continue;
    }

    const existingCategory = categoriesByName.get(categoryName);

    categoriesByName.set(categoryName, {
      id: normalizeId(product?.categoryId) || existingCategory?.id || categoriesByName.size + 1,
      name: categoryName,
      slug: slugify(categoryName),
      isRoot: true,
      productsCount: (existingCategory?.productsCount ?? 0) + 1,
      subcategories: [],
    });
  }

  return Array.from(categoriesByName.values())
    .sort((leftCategory, rightCategory) => leftCategory.name.localeCompare(rightCategory.name))
    .map((category) => normalizeCategory(category));
};

function getCategoriesTree() {
  return buildLocalCategoriesTree();
}

function getCategories() {
  return flattenCategories(getCategoriesTree());
}

function getCategoryById(categoryId) {
  const normalizedCategoryId = normalizeId(categoryId);
  return getCategories().find((category) => category.id === normalizedCategoryId) ?? null;
}

function getSubcategoriesByCategoryId(categoryId) {
  return getCategories().filter((category) => category.parentId === normalizeId(categoryId));
}

async function getCategoriesAsync() {
  if (!appConfig.useRemoteApi) {
    return getCategories();
  }

  const response = await requestJson('/categories', {
    method: 'GET',
  });

  return extractCollection(response).map((category) => normalizeCategory(category));
}

async function getCategoriesTreeAsync() {
  if (!appConfig.useRemoteApi) {
    return getCategoriesTree();
  }

  const response = await requestJson('/categories/tree', {
    method: 'GET',
  });

  return extractCollection(response).map((category) => normalizeCategory(category));
}

async function getCategoryByIdAsync(categoryId) {
  const normalizedCategoryId = normalizeId(categoryId);

  if (!appConfig.useRemoteApi) {
    return getCategoryById(normalizedCategoryId);
  }

  const response = await requestJson(`/categories/${normalizedCategoryId}`, {
    method: 'GET',
  });

  return normalizeCategory(response);
}

async function getSubcategoriesByCategoryIdAsync(categoryId) {
  const normalizedCategoryId = normalizeId(categoryId);

  if (!appConfig.useRemoteApi) {
    return getSubcategoriesByCategoryId(normalizedCategoryId);
  }

  const response = await requestJson(`/categories/${normalizedCategoryId}/subcategories`, {
    method: 'GET',
  });

  return extractCollection(response).map((category) => normalizeCategory(category));
}

const categoryService = {
  getCategories,
  getCategoriesAsync,
  getCategoriesTree,
  getCategoriesTreeAsync,
  getCategoryById,
  getCategoryByIdAsync,
  getSubcategoriesByCategoryId,
  getSubcategoriesByCategoryIdAsync,
};

export { categoryService };
export default categoryService;
