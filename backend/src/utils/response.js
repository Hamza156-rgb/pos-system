export const ok = (res, data, message = 'Success') =>
  res.json({ success: true, message, data });

export const created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const paginated = (res, { rows, count, page, limit }) =>
  res.json({
    success: true,
    data: rows,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / limit),
    },
  });
