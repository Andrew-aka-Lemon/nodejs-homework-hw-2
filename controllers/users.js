const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const fs = require('fs');
const multer = require('multer');

const { HttpError, ctrlWrapper } = require('../helpers');
const { User } = require('../models/users');

const { SECRET_KEY } = process.env;

const register = async (req, res) => {
  const { email, password } = req.body;
  const userExist = await User.findOne({ email });

  if (userExist) {
    throw HttpError(409, 'Email already is use');
  }
  const hashPass = await bcrypt.hash(password, 10);

  if (!req.body.avatarURL) {
    req.body.avatarURL = gravatar.url(req.body.email);
  } else {
    // req.file - аватарка
    // тут треба додати переміщення аватарки в папку аватарок
  }

  const newUser = await User.create({ ...req.body, password: hashPass });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: newUser.avatarURL,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const userExist = await User.findOne({ email });

  if (!userExist) {
    throw HttpError(401, 'Email or password invalid');
  }

  const isPassValid = await bcrypt.compare(password, userExist.password);

  if (!isPassValid) {
    throw HttpError(401, 'Email or password invalid');
  }

  const payload = { id: userExist._id };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });

  await User.findOneAndUpdate({ _id: userExist._id }, { token });

  res.status(200).json({
    token,
    user: {
      email: userExist.email,
      subscription: userExist.subscription,
    },
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;

  await User.findByIdAndUpdate({ _id }, { token: null });

  res.status(204);
};

const current = async (req, res) => {
  const { email, subscription } = req.user;
  res.status(200).json({ email, subscription });
};

const updateSubscription = async (req, res) => {
  const { subscription } = req.body;
  const { _id } = req.user;
  const user = await User.findByIdAndUpdate(
    { _id },
    {
      subscription,
    }
  );

  user.subscription = subscription;

  res.status(201).json(user);
};

const updateAvatar = async (req, res) => {};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  current: ctrlWrapper(current),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
};
