const express = require('express');
const { getSummary, getMonthlyAnalytics, getCategoryBreakdown, getTrendData } = require('../controllers/analyticsController');
const protect = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/summary', getSummary);
router.get('/monthly', getMonthlyAnalytics);
router.get('/categories', getCategoryBreakdown);
router.get('/trends', getTrendData);

module.exports = router;
