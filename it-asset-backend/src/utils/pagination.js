
export function parsePagination(query) {
  const rawPage = query.page ?? "1";
  const rawLimit = query.limit ?? "10";

  if (
    !/^[1-9]\d*$/.test(String(rawPage)) ||
    !/^[1-9]\d*$/.test(String(rawLimit))
  ) {
    return {
      error: "page dan limit harus berupa bilangan bulat positif.",
    };
  }

  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(limit) ||
    limit > 100
  ) {
    return {
      error: "page harus berupa bilangan bulat yang valid dan limit maksimal 100.",
    };
  }

  const skip = (page - 1) * limit;

  if (!Number.isSafeInteger(skip)) {
    return {
      error: "Nomor halaman terlalu besar.",
    };
  }

  return { page, limit, skip };
}

export function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
