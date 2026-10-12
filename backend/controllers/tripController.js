const Trip = require('../models/Trip');
const TripInvitation = require('../models/TripInvitation');

const normalizeNumber = (value) => Number(value || 0);

const asIdString = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim() || null;
  try {
    const id = String(value);
    return id && id !== '[object Object]' ? id : null;
  } catch (error) {
    return null;
  }
};

const isTripAdmin = (trip, userId) => {
  if (!trip) return false;
  const tripOwnerId = asIdString(trip.owner);
  const userIdString = asIdString(userId);

  if (tripOwnerId && userIdString && tripOwnerId === userIdString) return true;

  return (trip.members || []).some((member) => {
    const memberUserId = asIdString(member.user);
    return memberUserId && userIdString && memberUserId === userIdString && member.role === 'admin';
  });
};

const getTripMemberSummary = (trip) => {
  const acceptedMembers = (trip.members || []).filter((member) => member.status === 'accepted' && asIdString(member.user));
  const memberMap = {};

  acceptedMembers.forEach((member) => {
    const memberId = asIdString(member.user);
    if (!memberId) return;

    memberMap[memberId] = {
      user: member.user,
      name: member.name || member.email || 'Member',
      email: member.email || '',
      role: member.role,
      paid: 0,
      share: 0,
    };
  });

  const categoryTotals = {};
  let totalExpenses = 0;

  (trip.expenses || []).forEach((expense) => {
    const amount = normalizeNumber(expense.amount);
    totalExpenses += amount;

    const categoryKey = expense.category || 'Other';
    categoryTotals[categoryKey] = (categoryTotals[categoryKey] || 0) + amount;

    const payerId = asIdString(expense.payer);
    if (payerId && memberMap[payerId]) {
      memberMap[payerId].paid += amount;
    }

    const participants = (expense.participants && expense.participants.length)
      ? expense.participants
      : acceptedMembers.map((member) => ({ user: member.user, share: 1 }));

    const totalShares = participants.reduce((sum, participant) => sum + normalizeNumber(participant.share || participant.amount || participant.percentage || 1), 0);

    participants.forEach((participant) => {
      const memberId = asIdString(participant.user);
      if (!memberId || !memberMap[memberId]) return;

      let amountShare = 0;
      if (expense.splitType === 'equal') {
        amountShare = amount / Math.max(participants.length, 1);
      } else if (expense.splitType === 'custom') {
        amountShare = normalizeNumber(participant.amount);
      } else if (expense.splitType === 'percentage') {
        amountShare = amount * (normalizeNumber(participant.percentage) / 100);
      } else if (expense.splitType === 'shares') {
        amountShare = amount * (normalizeNumber(participant.share) / Math.max(totalShares, 1));
      } else {
        amountShare = amount / Math.max(participants.length, 1);
      }

      memberMap[memberId].share += amountShare;
    });
  });

  const balances = acceptedMembers.map((member) => {
    const memberId = asIdString(member.user);
    const record = memberId ? memberMap[memberId] || { paid: 0, share: 0 } : { paid: 0, share: 0 };
    const net = normalizeNumber(record.paid) - normalizeNumber(record.share);

    return {
      user: member.user,
      name: member.name || member.email || 'Member',
      email: member.email || '',
      role: member.role,
      paid: normalizeNumber(record.paid),
      share: normalizeNumber(record.share),
      net: Number(net.toFixed(2)),
      owes: net < 0 ? Number(Math.abs(net).toFixed(2)) : 0,
      receives: net > 0 ? Number(net.toFixed(2)) : 0,
    };
  });

  const debtors = balances.filter((balance) => balance.net < 0);
  const creditors = balances.filter((balance) => balance.net > 0);
  const suggestedSettlements = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const transferAmount = Math.min(Math.abs(debtor.net), creditor.net);

    if (transferAmount > 0) {
      suggestedSettlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: Number(transferAmount.toFixed(2)),
      });
    }

    debtor.net += transferAmount;
    creditor.net -= transferAmount;

    if (Math.abs(debtor.net) < 0.01) debtorIndex += 1;
    if (Math.abs(creditor.net) < 0.01) creditorIndex += 1;
  }

  return {
    totalExpenses,
    remainingBudget: normalizeNumber(trip.budget) - totalExpenses,
    categoryTotals: Object.entries(categoryTotals).map(([category, total]) => ({ category, total: Number(total.toFixed(2)) })),
    balances,
    suggestedSettlements,
  };
};

const getTripPayload = (trip, userId) => {
  const summary = getTripMemberSummary(trip);
  const userIdString = asIdString(userId);
  const memberState = (trip.members || []).find((member) => {
    const memberUserId = asIdString(member.user);
    return memberUserId && userIdString && memberUserId === userIdString;
  });

  return {
    ...trip.toObject(),
    summary,
    isAdmin: isTripAdmin(trip, userId),
    isMember: !!memberState || (asIdString(trip.owner) && userIdString && asIdString(trip.owner) === userIdString),
    memberStatus: memberState ? memberState.status : 'owner',
  };
};

const buildParticipants = (participants = [], trip, splitType = 'equal') => {
  const acceptedMembers = (trip.members || []).filter((member) => member.status === 'accepted' && asIdString(member.user));
  const selectedMembers = participants.length
    ? participants.map((participant) => (typeof participant === 'string' ? participant : asIdString(participant?.user)))
    : acceptedMembers.map((member) => asIdString(member.user));

  if (splitType === 'equal') {
    return acceptedMembers
      .filter((member) => {
        const memberId = asIdString(member.user);
        return memberId && selectedMembers.includes(memberId);
      })
      .map((member) => ({ user: member.user, share: 1 }));
  }

  if (splitType === 'custom') {
    return participants
      .filter((participant) => participant && participant.user)
      .map((participant) => ({
        user: participant.user,
        amount: Number(participant.amount || 0),
        share: 1,
      }));
  }

  if (splitType === 'percentage') {
    return participants
      .filter((participant) => participant && participant.user)
      .map((participant) => ({
        user: participant.user,
        percentage: Number(participant.percentage || 0),
        share: 1,
      }));
  }

  return participants
    .filter((participant) => participant && participant.user)
    .map((participant) => ({
      user: participant.user,
      share: Number(participant.share || 1),
      amount: 0,
    }));
};

const getTripsForUser = async (userId) => {
  const trips = await Trip.find({
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
  }).sort({ startDate: 1 }).lean();

  const adminTripIds = trips.filter((trip) => (
    asIdString(trip.owner) === asIdString(userId)
    || (trip.members || []).some((member) => member.status === 'accepted' && member.role === 'admin' && asIdString(member.user) === asIdString(userId))
  )).map((trip) => trip._id);
  const pendingInvitations = adminTripIds.length
    ? await TripInvitation.find({ trip: { $in: adminTripIds }, status: 'pending', expiresAt: { $gt: new Date() } })
      .select('trip email role status expiresAt').lean()
    : [];

  return trips
    .filter((trip) => asIdString(trip.owner) || (trip.members || []).some((member) => asIdString(member.user)))
    .map((trip) => ({
      ...trip,
      summary: getTripMemberSummary(trip),
      pendingInvitations: pendingInvitations
        .filter((invitation) => asIdString(invitation.trip) === asIdString(trip._id))
        .map(({ _id, email, role, status, expiresAt }) => ({ _id, email, role, status, expiresAt })),
    }));
};

const validateTripDates = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 'Trip name, destination, and dates are required.';
  }

  const parsedStart = new Date(startDate);
  const parsedEnd = new Date(endDate);

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return 'Please enter valid start and end dates.';
  }

  if (parsedEnd < parsedStart) {
    return 'End date cannot be earlier than the start date.';
  }

  return null;
};

const createTrip = async (req, res, next) => {
  try {
    const { name, destination, startDate, endDate, description, budget } = req.body;
    const trimmedName = String(name || '').trim();
    const trimmedDestination = String(destination || '').trim();
    const dateValidationError = validateTripDates(startDate, endDate);

    if (!trimmedName || !trimmedDestination || dateValidationError) {
      return res.status(400).json({ success: false, message: dateValidationError || 'Trip name, destination, and dates are required.' });
    }

    const trip = await Trip.create({
      owner: req.user._id,
      name: trimmedName,
      destination: trimmedDestination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: String(description || '').trim(),
      budget: Number(budget || 0),
      members: [{
        user: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: 'admin',
        status: 'accepted',
        invitedBy: req.user._id,
        joinedAt: new Date(),
      }],
      expenses: [],
      itinerary: [],
      settlements: [],
    });

    return res.status(201).json({ success: true, message: 'Trip created successfully.', trip: getTripPayload(trip, req.user._id) });
  } catch (error) {
    next(error);
  }
};

const getTrips = async (req, res, next) => {
  try {
    const trips = await getTripsForUser(req.user._id);
    return res.status(200).json({ success: true, trips });
  } catch (error) {
    next(error);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const tripOwnerId = asIdString(trip.owner);
    const userIdString = asIdString(req.user._id);
    const userIsMember = (tripOwnerId && userIdString && tripOwnerId === userIdString)
      || (trip.members || []).some((member) => {
        const memberUserId = asIdString(member.user);
        return memberUserId && userIdString && memberUserId === userIdString;
      });

    if (!userIsMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this trip.' });
    }

    return res.status(200).json({ success: true, trip: getTripPayload(trip, req.user._id) });
  } catch (error) {
    next(error);
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (!isTripAdmin(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this trip.' });
    }

    const { name, destination, startDate, endDate, description, budget } = req.body;

    if (name !== undefined) trip.name = String(name).trim();
    if (destination !== undefined) trip.destination = String(destination).trim();
    if (description !== undefined) trip.description = String(description).trim();
    if (budget !== undefined) trip.budget = Number(budget);

    const nextStartDate = startDate !== undefined ? startDate : trip.startDate;
    const nextEndDate = endDate !== undefined ? endDate : trip.endDate;
    const tripDateError = validateTripDates(nextStartDate, nextEndDate);

    if (tripDateError) {
      return res.status(400).json({ success: false, message: tripDateError });
    }

    if (startDate !== undefined) trip.startDate = new Date(startDate);
    if (endDate !== undefined) trip.endDate = new Date(endDate);

    await trip.save();
    return res.status(200).json({ success: true, message: 'Trip updated successfully.', trip: getTripPayload(trip, req.user._id) });
  } catch (error) {
    next(error);
  }
};

const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    if (asIdString(trip.owner) !== asIdString(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the trip owner can delete it.' });
    }

    await trip.deleteOne();
    await TripInvitation.deleteMany({ trip: trip._id });
    return res.status(200).json({ success: true, message: 'Trip deleted.' });
  } catch (error) {
    next(error);
  }
};

const respondInvite = async (req, res, next) => {
  try {
    const { status } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const member = trip.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Trip member not found.' });

    if (asIdString(member.user) !== asIdString(req.user._id) && member.email && member.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You cannot manage another member invitation.' });
    }

    member.status = ['accepted', 'declined'].includes(status) ? status : 'accepted';
    if (member.status === 'accepted') {
      member.joinedAt = new Date();
    }

    await trip.save();
    return res.status(200).json({ success: true, trip: getTripPayload(trip, req.user._id), member });
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const { title, category, amount, date, payer, notes, participants, splitType } = req.body;
    const acceptedMembers = trip.members.filter((member) => member.status === 'accepted');

    if (!title || !amount || !payer) {
      return res.status(400).json({ success: false, message: 'Expense title, amount, and payer are required.' });
    }

    const normalizedPayer = acceptedMembers.some((member) => asIdString(member.user) === asIdString(payer)) ? payer : req.user._id;
    const normalizedParticipants = buildParticipants(participants || acceptedMembers.map((member) => asIdString(member.user)).filter(Boolean), trip, splitType || 'equal');

    const expense = {
      title: title.trim(),
      category: category || 'Other',
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      payer: normalizedPayer,
      notes: notes || '',
      splitType: ['equal', 'custom', 'percentage', 'shares'].includes(splitType) ? splitType : 'equal',
      participants: normalizedParticipants,
      createdBy: req.user._id,
    };

    trip.expenses.push(expense);
    await trip.save();

    return res.status(201).json({ success: true, trip: getTripPayload(trip, req.user._id), expense });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const expense = trip.expenses.id(req.params.expenseId);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    if (asIdString(expense.createdBy) !== asIdString(req.user._id) && !isTripAdmin(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this expense.' });
    }

    const { title, category, amount, date, payer, notes, splitType, participants } = req.body;
    if (title) expense.title = title.trim();
    if (category) expense.category = category;
    if (amount !== undefined) expense.amount = Number(amount);
    if (date) expense.date = new Date(date);
    if (payer) expense.payer = payer;
    if (notes !== undefined) expense.notes = notes;
    if (splitType) expense.splitType = splitType;
    if (participants) expense.participants = buildParticipants(participants, trip, splitType || expense.splitType);

    await trip.save();
    return res.status(200).json({ success: true, trip: getTripPayload(trip, req.user._id), expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const expense = trip.expenses.id(req.params.expenseId);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    if (asIdString(expense.createdBy) !== asIdString(req.user._id) && !isTripAdmin(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this expense.' });
    }

    expense.deleteOne();
    await trip.save();
    return res.status(200).json({ success: true, trip: getTripPayload(trip, req.user._id), message: 'Expense deleted.' });
  } catch (error) {
    next(error);
  }
};

const createSettlement = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!isTripAdmin(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only admins can add settlements.' });
    }

    const { from, to, amount, note, status } = req.body;
    if (!from || !to || !amount) {
      return res.status(400).json({ success: false, message: 'Settlement sender, recipient and amount are required.' });
    }

    trip.settlements.push({
      from,
      to,
      amount: Number(amount),
      note: note || '',
      status: status === 'completed' ? 'completed' : 'pending',
      createdBy: req.user._id,
    });

    await trip.save();
    return res.status(201).json({ success: true, trip: getTripPayload(trip, req.user._id) });
  } catch (error) {
    next(error);
  }
};

const createItineraryItem = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!isTripAdmin(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only trip admins can add itinerary items.' });
    }

    const { title, place, date, time, notes, cost, mapUrl } = req.body;
    trip.itinerary.push({
      title: title?.trim() || 'New activity',
      place: place || '',
      date: date || '',
      time: time || '',
      notes: notes || '',
      cost: Number(cost || 0),
      mapUrl: mapUrl || '',
    });

    await trip.save();
    return res.status(201).json({ success: true, trip: getTripPayload(trip, req.user._id) });
  } catch (error) {
    next(error);
  }
};

const updateItineraryItem = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!isTripAdmin(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only trip admins can edit itinerary items.' });
    }

    const item = trip.itinerary.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Itinerary item not found.' });

    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined) item[key] = key === 'cost' ? Number(value) : value;
    });

    await trip.save();
    return res.status(200).json({ success: true, trip: getTripPayload(trip, req.user._id) });
  } catch (error) {
    next(error);
  }
};

const deleteItineraryItem = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!isTripAdmin(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only trip admins can delete itinerary items.' });
    }

    const item = trip.itinerary.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Itinerary item not found.' });

    item.deleteOne();
    await trip.save();
    return res.status(200).json({ success: true, trip: getTripPayload(trip, req.user._id) });
  } catch (error) {
    next(error);
  }
};

const getTripAnalytics = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const summary = getTripMemberSummary(trip);
    const plannedCost = (trip.itinerary || []).reduce((sum, item) => sum + normalizeNumber(item.cost), 0);
    const categoryBreakdown = summary.categoryTotals;
    const memberContributionData = summary.balances.map((member) => ({
      name: member.name,
      paid: member.paid,
      share: member.share,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary,
        plannedCost,
        actualCost: summary.totalExpenses,
        categoryBreakdown,
        memberContributionData,
        plannedVsActual: [
          { name: 'Planned', cost: plannedCost },
          { name: 'Actual', cost: summary.totalExpenses },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
