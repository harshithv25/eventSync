'use strict';
const { validationResult } = require('express-validator');
const CategoryModel = require('../models/category.model');

const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description } = req.body;

    const existing = await CategoryModel.findByName(name);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await CategoryModel.create({ name, description });
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await CategoryModel.findAll();
    return res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCategory, getAllCategories };
