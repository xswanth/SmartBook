
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ============================================
// CONSTANTS
// ============================================

const ALLOWED_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_LOCATION_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_SLOT_DURATION = 5;
const MAX_SLOT_DURATION = 240;

// Only expose fields intended for public provider profiles.
// Add other verified public columns here if your frontend needs them.
const PUBLIC_PROVIDER_FIELDS = [
  'id',
  'name',
  'category',
  'location',
  'description',
  'working_days',
  'start_time',
  'end_time',
  'slot_duration',
].join(',');

// ============================================
// HELPERS
// ============================================

function isValidId(id) {
  return (
    typeof id === 'string' &&
    id.trim().length > 0 &&
    id.length <= 100
  );
}

function isValidText(value, maxLength) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    error: message,
  });
}

function logDatabaseError(context, error) {
  console.error(`${context}:`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
}

function validateWorkingDays(days) {
  return (
    Array.isArray(days) &&
    days.length > 0 &&
    days.every((day) => ALLOWED_DAYS.includes(day)) &&
    new Set(days).size === days.length
  );
}

function validateSchedule(startTime, endTime, slotDuration) {
  const duration = Number(slotDuration);

  return (
    typeof startTime === 'string' &&
    typeof endTime === 'string' &&
    TIME_PATTERN.test(startTime) &&
    TIME_PATTERN.test(endTime) &&
    startTime < endTime &&
    Number.isInteger(duration) &&
    duration >= MIN_SLOT_DURATION &&
    duration <= MAX_SLOT_DURATION
  );
}

// ============================================
// GET ALL APPROVED PROVIDERS
// GET /api/providers
//
// Query parameters:
// ?category=Doctor
// ?search=John
// ?location=Hyderabad
// ?page=1
// ?limit=12
// ============================================

router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      location,
      page = '1',
      limit = String(DEFAULT_LIMIT),
    } = req.query;

    // Validate query parameter types.
    if (
      typeof page !== 'string' ||
      typeof limit !== 'string' ||
      (category !== undefined && typeof category !== 'string') ||
      (search !== undefined && typeof search !== 'string') ||
      (location !== undefined && typeof location !== 'string')
    ) {
      return sendError(res, 400, 'Invalid query parameters');
    }

    const currentPage = Number(page);
    const requestedLimit = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      currentPage < 1 ||
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return sendError(res, 400, 'Invalid pagination parameters');
    }

    if (
      search &&
      search.trim().length > MAX_SEARCH_LENGTH
    ) {
      return sendError(res, 400, 'Search text is too long');
    }

    if (
      location &&
      location.trim().length > MAX_LOCATION_LENGTH
    ) {
      return sendError(res, 400, 'Location text is too long');
    }

    if (category && category.trim().length > MAX_SEARCH_LENGTH) {
      return sendError(res, 400, 'Category is too long');
    }

    const safeLimit = Math.min(requestedLimit, MAX_LIMIT);
    const from = (currentPage - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = supabase
      .from('providers')
      .select(PUBLIC_PROVIDER_FIELDS, { count: 'exact' })
      .eq('is_approved', true);

    // Category filter.
    if (category?.trim() && category.trim().toLowerCase() !== 'all') {
      query = query.eq('category', category.trim());
    }

    // Provider name search.
    if (search?.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    // Location filter.
    if (location?.trim()) {
      query = query.ilike('location', `%${location.trim()}%`);
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(from, to);

    if (error) {
      logDatabaseError('Fetch providers error', error);
      return sendError(res, 500, 'Unable to fetch providers');
    }

    // Preserve the existing array response for frontend compatibility.
    res.set('X-Total-Count', String(count ?? 0));
    res.set('X-Current-Page', String(currentPage));
    res.set('X-Page-Limit', String(safeLimit));

    return res.status(200).json(data || []);

  } catch (error) {
    console.error('GET providers error:', error);
    return sendError(res, 500, 'Internal server error');
  }
});

// ============================================
// GET SINGLE APPROVED PROVIDER
// GET /api/providers/:id
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, 'Invalid provider ID');
    }

    const { data, error } = await supabase
      .from('providers')
      .select(PUBLIC_PROVIDER_FIELDS)
      .eq('id', id)
      .eq('is_approved', true)
      .maybeSingle();

    if (error) {
      logDatabaseError('Fetch single provider error', error);
      return sendError(res, 500, 'Unable to fetch provider');
    }

    if (!data) {
      return sendError(res, 404, 'Provider not found');
    }

    // Preserve the existing single-object response.
    return res.status(200).json(data);

  } catch (error) {
    console.error('GET provider details error:', error);
    return sendError(res, 500, 'Internal server error');
  }
});

// ============================================
// UPDATE PROVIDER WORKING HOURS
// PUT /api/providers/:id
//
// Expected body:
// {
//   working_days: ['Monday', 'Tuesday'],
//   start_time: '09:00',
//   end_time: '18:00',
//   slot_duration: 30,
//   description: 'Service description',
//   location: 'Hyderabad'
// }
// ============================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, 'Invalid provider ID');
    }

    // Ensure request body is an object.
    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return sendError(res, 400, 'Invalid request body');
    }

    const {
      working_days,
      start_time,
      end_time,
      slot_duration,
      description,
      location,
    } = req.body;

    // Validate working days.
    if (!validateWorkingDays(working_days)) {
      return sendError(
        res,
        400,
        'Select at least one valid and unique working day'
      );
    }

    // Validate working schedule.
    if (!validateSchedule(start_time, end_time, slot_duration)) {
      return sendError(
        res,
        400,
        'Invalid schedule. Check start time, end time and slot duration'
      );
    }

    // Validate optional description.
    if (
      description !== undefined &&
      (
        typeof description !== 'string' ||
        description.trim().length > MAX_DESCRIPTION_LENGTH
      )
    ) {
      return sendError(res, 400, 'Invalid description');
    }

    // Validate optional location.
    if (
      location !== undefined &&
      (
        typeof location !== 'string' ||
        location.trim().length === 0 ||
        location.trim().length > MAX_LOCATION_LENGTH
      )
    ) {
      return sendError(res, 400, 'Invalid location');
    }

    // Build an allowlisted update object.
    // Do not spread req.body directly into a database update.
    const updates = {
      working_days,
      start_time,
      end_time,
      slot_duration: Number(slot_duration),
    };

    if (description !== undefined) {
      updates.description = description.trim();
    }

    if (location !== undefined) {
      updates.location = location.trim();
    }

    const { data, error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', id)
      .select(PUBLIC_PROVIDER_FIELDS)
      .maybeSingle();

    if (error) {
      logDatabaseError('Update provider error', error);
      return sendError(res, 500, 'Unable to update provider details');
    }

    if (!data) {
      return sendError(res, 404, 'Provider not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Provider schedule updated successfully',
      provider: data,
    });

  } catch (error) {
    console.error('PUT provider error:', error);
    return sendError(res, 500, 'Internal server error');
  }
});

module.exports = router;
