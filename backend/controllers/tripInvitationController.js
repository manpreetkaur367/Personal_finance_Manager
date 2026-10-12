const { createHash, randomBytes } = require('crypto');
const Trip = require('../models/Trip');
const User = require('../models/User');
const TripInvitation = require('../models/TripInvitation');
const invitationEmail = require('../utils/tripInvitationEmail');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const newToken = () => randomBytes(32).toString('base64url');
const expiresInSevenDays = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const idEquals = (left, right) => left != null && right != null && String(left) === String(right);

const isTripAdmin = (trip, userId) => idEquals(trip.owner, userId) || trip.members.some((member) => (
  member.role === 'admin' && member.status === 'accepted' && idEquals(member.user, userId)
));

const sendInvitation = (invitation, trip, inviter, token) => invitationEmail.sendTripInvitation({
  to: invitation.email,
  tripName: trip.name,
  inviterName: inviter.name || inviter.email,
  token,
});

const findPendingInvitation = async (token) => {
  if (typeof token !== 'string' || token.length < 32 || token.length > 128) return null;
  return TripInvitation.findOne({ tokenHash: hashToken(token) }).select('+tokenHash');
};

const inviteMember = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
  if (!isTripAdmin(trip, req.user._id)) return res.status(403).json({ success: false, message: 'Only trip admins can invite members.' });

  const email = normalizeEmail(req.body.email);
  const role = req.body.role === 'admin' ? 'admin' : 'member';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid member email address.' });
  }

  const existingUser = await User.findOne({ email }).select('_id');
  const existingMember = trip.members.find((member) => (
    normalizeEmail(member.email) === email || (existingUser && idEquals(member.user, existingUser._id))
  ));
  if (existingMember?.status === 'accepted') {
    return res.status(409).json({ success: false, message: 'This person is already a member of the trip.' });
  }

  const existingInvitation = await TripInvitation.findOne({ trip: trip._id, email, status: 'pending' });
  if (existingInvitation && existingInvitation.expiresAt > new Date()) {
    return res.status(409).json({ success: false, message: 'An invitation is already pending for this email. Resend it from the pending invitations list.' });
  }
  if (existingInvitation) {
    existingInvitation.status = 'expired';
    await existingInvitation.save();
  }

  const token = newToken();
  let invitation;
  try {
    invitation = await TripInvitation.create({
      trip: trip._id,
      email,
      role,
      invitedBy: req.user._id,
      status: 'pending',
      tokenHash: hashToken(token),
      expiresAt: expiresInSevenDays(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An invitation is already pending for this email.' });
    }
    throw error;
  }

  try {
    await sendInvitation(invitation, trip, req.user, token);
  } catch (_error) {
    await TripInvitation.deleteOne({ _id: invitation._id });
    return res.status(502).json({ success: false, message: 'Invitation email could not be sent. Check the Gmail SMTP settings and try again.' });
  }

  return res.status(201).json({
    success: true,
    message: `Invitation email sent to ${email}.`,
    invitation: { _id: invitation._id, email, role, status: invitation.status, expiresAt: invitation.expiresAt },
  });
};

const resendInvitation = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
  if (!isTripAdmin(trip, req.user._id)) return res.status(403).json({ success: false, message: 'Only trip admins can resend invitations.' });

  const invitation = await TripInvitation.findOne({ _id: req.params.invitationId, trip: trip._id, status: 'pending' }).select('+tokenHash');
  if (!invitation) return res.status(404).json({ success: false, message: 'Pending invitation not found.' });
  if (invitation.expiresAt <= new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    return res.status(410).json({ success: false, message: 'This invitation has expired. Create a new invitation for this email.' });
  }

  const oldHash = invitation.tokenHash;
  const oldExpiry = invitation.expiresAt;
  const token = newToken();
  invitation.tokenHash = hashToken(token);
  invitation.expiresAt = expiresInSevenDays();
  await invitation.save();

  try {
    await sendInvitation(invitation, trip, req.user, token);
  } catch (_error) {
    invitation.tokenHash = oldHash;
    invitation.expiresAt = oldExpiry;
    await invitation.save();
    return res.status(502).json({ success: false, message: 'Invitation email could not be sent. Check the Gmail SMTP settings and try again.' });
  }

  return res.status(200).json({ success: true, message: `Invitation email resent to ${invitation.email}.` });
};

const verifyInvitation = async (req, res) => {
  const invitation = await findPendingInvitation(req.body.token);
  if (!invitation) return res.status(404).json({ success: false, message: 'This invitation link is invalid or has already been used.' });
  if (invitation.status !== 'pending') return res.status(410).json({ success: false, message: 'This invitation is no longer pending.' });
  if (invitation.expiresAt <= new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    return res.status(410).json({ success: false, message: 'This invitation link has expired. Ask the trip owner to send a new invitation.' });
  }

  const [trip, inviter] = await Promise.all([
    Trip.findById(invitation.trip).select('name'),
    User.findById(invitation.invitedBy).select('name'),
  ]);
  if (!trip) return res.status(404).json({ success: false, message: 'The trip for this invitation no longer exists.' });

  return res.status(200).json({
    success: true,
    invitation: {
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      tripName: trip.name,
      inviterName: inviter?.name || 'A SpendWise user',
    },
  });
};

const acceptInvitation = async (req, res) => {
  const invitation = await findPendingInvitation(req.body.token);
  if (!invitation) return res.status(404).json({ success: false, message: 'This invitation link is invalid or has already been used.' });

  const userEmail = normalizeEmail(req.user.email);
  if (userEmail !== invitation.email) {
    return res.status(403).json({ success: false, message: `Sign in or register with ${invitation.email} to accept this invitation.` });
  }
  if (invitation.status !== 'pending') {
    if (invitation.status === 'accepted' && idEquals(invitation.acceptedBy, req.user._id)) {
      return res.status(200).json({ success: true, message: 'You have already joined this trip.', tripId: invitation.trip });
    }
    return res.status(410).json({ success: false, message: 'This invitation is no longer pending.' });
  }
  if (invitation.expiresAt <= new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    return res.status(410).json({ success: false, message: 'This invitation link has expired. Ask the trip owner to send a new invitation.' });
  }

  const trip = await Trip.findById(invitation.trip);
  if (!trip) return res.status(404).json({ success: false, message: 'The trip for this invitation no longer exists.' });

  const existingMember = trip.members.find((member) => (
    idEquals(member.user, req.user._id) || normalizeEmail(member.email) === invitation.email
  ));
  if (existingMember) {
    existingMember.user = req.user._id;
    existingMember.email = userEmail;
    existingMember.name = req.user.name;
    existingMember.role = invitation.role;
    existingMember.status = 'accepted';
    existingMember.invitedBy = invitation.invitedBy;
    existingMember.joinedAt = existingMember.joinedAt || new Date();
    await trip.save();
  } else {
    const membership = {
      user: req.user._id,
      name: req.user.name,
      email: userEmail,
      role: invitation.role,
      status: 'accepted',
      invitedBy: invitation.invitedBy,
      joinedAt: new Date(),
    };
    const update = await Trip.updateOne(
      { _id: trip._id, 'members.user': { $ne: req.user._id } },
      { $push: { members: membership } }
    );
    if (!update.modifiedCount) {
      const latestTrip = await Trip.findById(trip._id);
      const racedMember = latestTrip?.members.find((member) => idEquals(member.user, req.user._id));
      if (!racedMember) return res.status(409).json({ success: false, message: 'Could not add you to this trip. Please try accepting the invitation again.' });
    }
  }

  invitation.status = 'accepted';
  invitation.acceptedBy = req.user._id;
  invitation.acceptedAt = new Date();
  await invitation.save();

  return res.status(200).json({ success: true, message: 'Invitation accepted. You have joined the trip.', tripId: trip._id });
};

module.exports = { inviteMember, resendInvitation, verifyInvitation, acceptInvitation };
