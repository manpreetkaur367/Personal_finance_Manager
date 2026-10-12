const User = require('../models/User');

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  return res.status(200).json({ success: true, user });
};

const updatePreferences = async (req, res, next) => {
  try {
    const { preferredCurrency } = req.body;
    const user = await User.findById(req.user._id);

    if (preferredCurrency) {
      user.preferredCurrency = preferredCurrency;
      await user.save();
    }

    return res.status(200).json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updatePreferences,
};
