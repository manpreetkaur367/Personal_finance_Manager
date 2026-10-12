const express = require('express');
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  respondInvite,
  createExpense,
  updateExpense,
  deleteExpense,
  createSettlement,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  getTripAnalytics,
} = require('../controllers/tripController');
const { inviteMember, resendInvitation } = require('../controllers/tripInvitationController');
const protect = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getTrips);
router.post('/', createTrip);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/members/invite', inviteMember);
router.post('/:id/invitations/:invitationId/resend', resendInvitation);
router.put('/:id/members/:memberId/respond', respondInvite);
router.post('/:id/expenses', createExpense);
router.put('/:id/expenses/:expenseId', updateExpense);
router.delete('/:id/expenses/:expenseId', deleteExpense);
router.post('/:id/settlements', createSettlement);
router.post('/:id/itinerary', createItineraryItem);
router.put('/:id/itinerary/:itemId', updateItineraryItem);
router.delete('/:id/itinerary/:itemId', deleteItineraryItem);
router.get('/:id/analytics', getTripAnalytics);

module.exports = router;
