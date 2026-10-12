const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const Trip = require('../models/Trip');
const TripInvitation = require('../models/TripInvitation');
const invitationEmail = require('../utils/tripInvitationEmail');

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('GET /api/health returns service status', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.match(response.body.message, /SpendWise/i);
});

test('POST /api/auth/register creates a new user', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'TestPass123!'
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.email, 'testuser@example.com');
});

test('POST /api/auth/login authenticates valid credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'testuser@example.com',
      password: 'TestPass123!'
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.token);
});

test('GET /api/analytics/summary returns correct totals for the user', async () => {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Analytics User',
      email: 'analytics@example.com',
      password: 'TestPass123!'
    });

  assert.equal(registerResponse.status, 201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'analytics@example.com',
      password: 'TestPass123!'
    });

  assert.equal(loginResponse.status, 200);
  const token = loginResponse.body.token;

  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Salary',
      amount: 20000,
      type: 'income',
      category: 'Salary',
      date: '2026-10-01',
      paymentMethod: 'Bank Transfer',
      notes: 'Monthly salary'
    });

  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Groceries',
      amount: 5000,
      type: 'expense',
      category: 'Food & Groceries',
      date: '2026-10-05',
      paymentMethod: 'Cash',
      notes: 'Household groceries'
    });

  const response = await request(app)
    .get('/api/analytics/summary')
    .set('Authorization', `Bearer ${token}`)
    .query({ month: 10, year: 2026 });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.summary.totalIncome, 20000);
  assert.equal(response.body.summary.totalExpenses, 5000);
  assert.equal(response.body.summary.netSavings, 15000);
  assert.equal(response.body.summary.transactionCount, 2);
});

test('POST /api/trips creates a trip and calculates the initial trip summary', async () => {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Trip User',
      email: 'tripuser@example.com',
      password: 'TestPass123!'
    });

  assert.equal(registerResponse.status, 201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'tripuser@example.com',
      password: 'TestPass123!'
    });

  const token = loginResponse.body.token;
  assert.equal(loginResponse.status, 200);

  const tripResponse = await request(app)
    .post('/api/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Bali Weekend',
      destination: 'Bali',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      description: 'Group vacation',
      budget: 15000
    });

  assert.equal(tripResponse.status, 201);
  assert.equal(tripResponse.body.success, true);
  assert.equal(tripResponse.body.trip.name, 'Bali Weekend');
  assert.equal(tripResponse.body.trip.members.length, 1);
  assert.equal(tripResponse.body.trip.members[0].role, 'admin');

  const tripsResponse = await request(app)
    .get('/api/trips')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(tripsResponse.status, 200);
  assert.equal(tripsResponse.body.success, true);
  assert.equal(tripsResponse.body.trips.length, 1);
});

test('GET /api/trips ignores malformed legacy trip records without crashing', async () => {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Legacy Trip User',
      email: 'legacytrip@example.com',
      password: 'TestPass123!'
    });

  assert.equal(registerResponse.status, 201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'legacytrip@example.com',
      password: 'TestPass123!'
    });

  assert.equal(loginResponse.status, 200);
  const token = loginResponse.body.token;

  await Trip.collection.insertOne({
    name: 'Broken Legacy Trip',
    destination: 'Nowhere',
    startDate: new Date('2026-12-01'),
    endDate: new Date('2026-12-05'),
    description: 'Legacy record with missing owner',
    budget: 500,
    owner: null,
    members: [{
      user: null,
      name: 'Broken member',
      email: 'broken@example.com',
      role: 'admin',
      status: 'accepted',
      invitedBy: null,
      joinedAt: new Date(),
    }],
    expenses: [],
    itinerary: [],
    settlements: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const response = await request(app)
    .get('/api/trips')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.trips));
});

test('POST /api/auth/login rejects invalid credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'testuser@example.com',
      password: 'WrongPass123!'
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('transaction CRUD is user-scoped and category analytics honors the selected month', async () => {
  const register = await request(app).post('/api/auth/register').send({
    name: 'Finance Owner', email: 'finance-owner@example.com', password: 'TestPass123!'
  });
  const token = register.body.token;
  assert.equal(register.status, 201);

  const create = await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`).send({
    title: 'December groceries', amount: 1250, type: 'expense', category: 'Food & Groceries',
    date: '2026-12-15', paymentMethod: 'UPI',
  });
  assert.equal(create.status, 201);
  const transactionId = create.body.transaction._id;

  const list = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`).query({ page: 1, limit: 1, search: 'groceries' });
  assert.equal(list.status, 200);
  assert.equal(list.body.pagination.total, 1);
  assert.equal(list.body.transactions[0]._id, transactionId);

  const categoryResult = await request(app).get('/api/analytics/categories').set('Authorization', `Bearer ${token}`).query({ month: 12, year: 2026 });
  assert.equal(categoryResult.status, 200);
  assert.deepEqual(categoryResult.body.data, [{ category: 'Food & Groceries', total: 1250 }]);

  const otherRegister = await request(app).post('/api/auth/register').send({
    name: 'Other Owner', email: 'finance-other@example.com', password: 'TestPass123!'
  });
  const otherToken = otherRegister.body.token;
  const otherRead = await request(app).get(`/api/transactions/${transactionId}`).set('Authorization', `Bearer ${otherToken}`);
  assert.equal(otherRead.status, 404);

  const update = await request(app).put(`/api/transactions/${transactionId}`).set('Authorization', `Bearer ${token}`).send({ title: 'Updated groceries', amount: 1500 });
  assert.equal(update.status, 200);
  assert.equal(update.body.transaction.amount, 1500);

  const remove = await request(app).delete(`/api/transactions/${transactionId}`).set('Authorization', `Bearer ${token}`);
  assert.equal(remove.status, 200);
  const missing = await request(app).get(`/api/transactions/${transactionId}`).set('Authorization', `Bearer ${token}`);
  assert.equal(missing.status, 404);
});

test('budget CRUD calculates December spending and protects another user budget', async () => {
  const register = await request(app).post('/api/auth/register').send({
    name: 'Budget Owner', email: 'budget-owner@example.com', password: 'TestPass123!'
  });
  const token = register.body.token;

  await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`).send({
    title: 'December rent', amount: 8000, type: 'expense', category: 'Rent',
    date: '2026-12-10', paymentMethod: 'Bank Transfer',
  }).expect(201);

  const create = await request(app).post('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category: 'Rent', amount: 10000, month: 12, year: 2026 });
  assert.equal(create.status, 201);
  const budgetId = create.body.budget._id;

  const read = await request(app).get('/api/budgets').set('Authorization', `Bearer ${token}`).query({ month: 12, year: 2026 });
  assert.equal(read.status, 200);
  assert.equal(read.body.budgets[0].spent, 8000);
  assert.equal(read.body.budgets[0].remaining, 2000);

  const otherRegister = await request(app).post('/api/auth/register').send({
    name: 'Budget Other', email: 'budget-other@example.com', password: 'TestPass123!'
  });
  const otherToken = otherRegister.body.token;
  const forbiddenUpdate = await request(app).put(`/api/budgets/${budgetId}`).set('Authorization', `Bearer ${otherToken}`).send({ amount: 1 });
  assert.equal(forbiddenUpdate.status, 404);

  const update = await request(app).put(`/api/budgets/${budgetId}`).set('Authorization', `Bearer ${token}`).send({ amount: 12000 });
  assert.equal(update.status, 200);
  assert.equal(update.body.budget.amount, 12000);

  const remove = await request(app).delete(`/api/budgets/${budgetId}`).set('Authorization', `Bearer ${token}`);
  assert.equal(remove.status, 200);
});

test('trip invitations email securely, resend with token rotation, and accept only for the invited email', async () => {
  const owner = await request(app).post('/api/auth/register').send({
    name: 'Trip Owner', email: 'invitation-owner@example.com', password: 'TestPass123!'
  });
  const invitee = await request(app).post('/api/auth/register').send({
    name: 'Trip Invitee', email: 'invited-person@example.com', password: 'TestPass123!'
  });
  const wrongUser = await request(app).post('/api/auth/register').send({
    name: 'Wrong Account', email: 'wrong-person@example.com', password: 'TestPass123!'
  });
  assert.equal(owner.status, 201);
  assert.equal(invitee.status, 201);
  assert.equal(wrongUser.status, 201);

  const tripResponse = await request(app).post('/api/trips').set('Authorization', `Bearer ${owner.body.token}`).send({
    name: 'Invitation Test Trip', destination: 'Osaka', startDate: '2026-11-02', endDate: '2026-11-06', budget: 1000,
  });
  assert.equal(tripResponse.status, 201);
  const tripId = tripResponse.body.trip._id;

  const sent = [];
  const originalSend = invitationEmail.sendTripInvitation;
  invitationEmail.sendTripInvitation = async (message) => { sent.push(message); };
  try {
    const invited = await request(app).post(`/api/trips/${tripId}/members/invite`)
      .set('Authorization', `Bearer ${owner.body.token}`)
      .send({ email: 'Invited-Person@example.com', role: 'member' });
    assert.equal(invited.status, 201);
    assert.match(invited.body.message, /sent/i);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'invited-person@example.com');
    assert.equal(sent[0].tripName, 'Invitation Test Trip');
    assert.equal(sent[0].inviterName, 'Trip Owner');

    const initialToken = sent[0].token;
    let invitation = await TripInvitation.findById(invited.body.invitation._id).select('+tokenHash');
    assert.equal(invitation.status, 'pending');
    assert.notEqual(invitation.tokenHash, initialToken);
    assert.equal(tripResponse.body.trip.members.length, 1, 'invitee is not a trip member until acceptance');

    const verify = await request(app).post('/api/invitations/verify').send({ token: initialToken });
    assert.equal(verify.status, 200);
    assert.equal(verify.body.invitation.email, 'invited-person@example.com');
    assert.equal(verify.body.invitation.tripName, 'Invitation Test Trip');

    const duplicate = await request(app).post(`/api/trips/${tripId}/members/invite`)
      .set('Authorization', `Bearer ${owner.body.token}`).send({ email: 'invited-person@example.com' });
    assert.equal(duplicate.status, 409);

    const resend = await request(app).post(`/api/trips/${tripId}/invitations/${invitation._id}/resend`)
      .set('Authorization', `Bearer ${owner.body.token}`);
    assert.equal(resend.status, 200);
    assert.equal(sent.length, 2);
    assert.notEqual(sent[1].token, initialToken);
    assert.equal((await request(app).post('/api/invitations/verify').send({ token: initialToken })).status, 404);

    const wrongAccept = await request(app).post('/api/invitations/accept')
      .set('Authorization', `Bearer ${wrongUser.body.token}`).send({ token: sent[1].token });
    assert.equal(wrongAccept.status, 403);

    const accept = await request(app).post('/api/invitations/accept')
      .set('Authorization', `Bearer ${invitee.body.token}`).send({ token: sent[1].token });
    assert.equal(accept.status, 200);
    const tripAfterAccept = await Trip.findById(tripId);
    assert.equal(tripAfterAccept.members.length, 2);
    assert.equal(tripAfterAccept.members[1].email, 'invited-person@example.com');
    assert.equal(tripAfterAccept.members[1].status, 'accepted');
    invitation = await TripInvitation.findById(invitation._id);
    assert.equal(invitation.status, 'accepted');

    const inviteeTrips = await request(app).get('/api/trips').set('Authorization', `Bearer ${invitee.body.token}`);
    assert.equal(inviteeTrips.status, 200);
    assert.equal(inviteeTrips.body.trips.some((trip) => trip._id === tripId), true);
    const repeatAccept = await request(app).post('/api/invitations/accept')
      .set('Authorization', `Bearer ${invitee.body.token}`).send({ token: sent[1].token });
    assert.equal(repeatAccept.status, 200);
  } finally {
    invitationEmail.sendTripInvitation = originalSend;
  }
});

test('failed invitation email does not report success or leave a pending invitation', async () => {
  const owner = await request(app).post('/api/auth/register').send({
    name: 'Mail Failure Owner', email: 'mail-failure-owner@example.com', password: 'TestPass123!'
  });
  const trip = await request(app).post('/api/trips').set('Authorization', `Bearer ${owner.body.token}`).send({
    name: 'Mail Failure Trip', destination: 'Delhi', startDate: '2026-12-01', endDate: '2026-12-02',
  });

  const originalSend = invitationEmail.sendTripInvitation;
  invitationEmail.sendTripInvitation = async () => { throw new Error('SMTP auth failed'); };
  try {
    const response = await request(app).post(`/api/trips/${trip.body.trip._id}/members/invite`)
      .set('Authorization', `Bearer ${owner.body.token}`).send({ email: 'will-not-receive@example.com' });
    assert.equal(response.status, 502);
    assert.match(response.body.message, /could not be sent/i);
    assert.equal(await TripInvitation.countDocuments({ trip: trip.body.trip._id }), 0);
  } finally {
    invitationEmail.sendTripInvitation = originalSend;
  }
});
