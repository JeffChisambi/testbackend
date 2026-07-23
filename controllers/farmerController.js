const { sendSuccess, sendError } = require('../utils/responseHandler');
const {
  findFarmerByNrc,
  createFarmer,
  listFarmers,
  getFarmerDetails,
  updateFarmerById
} = require('../services/farmerService');

/**
 * Register a new farmer (FR-3.1 - FR-3.7, MFR-2)
 */
const registerFarmer = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      nrc_id,
      phone,
      gender,
      date_of_birth,
      address,
      club_id,
      gps_latitude,
      gps_longitude,
      fingerprint_template,
      crops
    } = req.body;

    const existingNrc = await findFarmerByNrc(nrc_id);
    if (existingNrc && existingNrc.length > 0) {
      return sendError(res, `A farmer with NRC/National ID '${nrc_id}' is already registered.`, 400);
    }

    const registeredByUserId = req.user ? req.user.id : null;
    const { savedFarmer } = await createFarmer({
      farmerData: {
        first_name,
        last_name,
        nrc_id,
        phone,
        gender,
        date_of_birth,
        address,
        club_id,
        gps_latitude,
        gps_longitude,
        fingerprint_template
      },
      crops,
      registeredByUserId
    });

    return sendSuccess(res, 'Farmer registered successfully', savedFarmer, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Search & List Farmers (FR-3.9)
 */
const getFarmers = async (req, res, next) => {
  try {
    const { search, club_id, page = 1, limit = 10 } = req.query;
    const { farmers, total } = await listFarmers({ search, clubId: club_id, page, limit });

    return sendSuccess(res, 'Farmers list retrieved successfully', {
      farmers,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Farmer Details & History (FR-3.12)
 */
const getFarmerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by numeric primary key ID or string farmer_id
    const farmerData = await getFarmerDetails(id);

    if (!farmerData) {
      return sendError(res, 'Farmer record not found.', 404);
    }

    const { farmer, crops, seedLoans, purchases } = farmerData;

    return sendSuccess(res, 'Farmer details retrieved', {
      farmer,
      crops,
      seedLoans,
      purchases
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Farmer Information (FR-3.8)
 */
const updateFarmer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, address, club_id, fingerprint_template, status } = req.body;

    const updated = await updateFarmerById(id, { first_name, last_name, phone, address, club_id, fingerprint_template, status });
    if (!updated) {
      return sendError(res, 'Farmer record not found.', 404);
    }

    return sendSuccess(res, 'Farmer updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFarmer,
  getFarmers,
  getFarmerById,
  updateFarmer
};
