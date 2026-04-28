
const Combo = require('../models/Combo');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const getCombos = async (req, res, next) => {
    const combos = await Combo.find().populate('products.productId', 'name price discountPrice images isAvailable');
    sendResponse(res, 200, 'Combos fetched', { combos });
};

const createCombo = async (req, res, next) => {
    try {
        const { name, description, comboPrice, discountAmount, status, products } = req.body;

        let parsedProducts = [];
        if (products) {
            parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
        }

        // Validate products
        let actualPrice = 0;
        for (const item of parsedProducts) {
            const product = await Product.findById(item.product);
            if (!product) {
                return next(new AppError(`Product with ID ${item.product} not found`, 404));
            }
            if (!product.isAvailable) {
                return next(new AppError(`Product ${product.name} is currently unavailable`, 400));
            }
            // Calculate actual price (sum of product prices * quantity)
            const productPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
            actualPrice += productPrice * (item.quantity || 1);
        }

        const comboData = {
            comboName: name,
            description,
            comboPrice: parseFloat(comboPrice) || 0,
            actualPrice,
            discountAmount: parseFloat(discountAmount) || 0,
            status: status === 'true' || status === true ? 'active' : 'inactive',
            products: parsedProducts.map(p => ({
                productId: p.product,
                quantity: p.quantity || 1
            }))
        };

        // Handle image upload
        if (req.file) {
            comboData.comboImage = `/uploads/combo/${req.file.filename}`;
        }

        const combo = await Combo.create(comboData);
        await combo.populate('products.productId', 'name price discountPrice images isAvailable');

        sendResponse(res, 201, 'Combo created', { combo });
    } catch (error) {
        next(error);
    }
};

const updateCombo = async (req, res, next) => {
    try {
        const { name, description, comboPrice, discountAmount, status, products } = req.body;

        let parsedProducts = [];
        if (products) {
            parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
        }

        // Validate products if provided
        let actualPrice = 0;
        if (parsedProducts.length > 0) {
            for (const item of parsedProducts) {
                const product = await Product.findById(item.product);

                if (!product) {
                    return next(new AppError(`Product with ID ${item.product} not found`, 404));
                }
                if (!product.isAvailable) {
                    return next(new AppError(`Product ${product.name} is currently unavailable`, 400));
                }
                // Calculate actual price
                const productPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
                actualPrice += productPrice * (item.quantity || 1);
            }
        }

        const updateData = {};

        if (name) updateData.comboName = name;
        if (description) updateData.description = description;
        if (comboPrice) updateData.comboPrice = parseFloat(comboPrice);
        if (discountAmount) updateData.discountAmount = parseFloat(discountAmount);
        if (actualPrice > 0) updateData.actualPrice = actualPrice;
        if (status) updateData.status = status === 'true' || status === true ? 'active' : 'inactive';

        if (parsedProducts.length > 0) {
            updateData.products = parsedProducts.map(p => ({
                productId: p.product,
                quantity: p.quantity || 1
            }));
        }

        // Handle image upload
        if (req.file) {
            updateData.comboImage = `/uploads/combo/${req.file.filename}`;
        }

        const combo = await Combo.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('products.productId', 'name price discountPrice images isAvailable');

        if (!combo) return next(new AppError('Combo not found', 404));
        sendResponse(res, 200, 'Combo updated', { combo });
    } catch (error) {
        next(error);
    }
};

const deleteCombo = async (req, res, next) => {
    const combo = await Combo.findById(req.params.id);
    if (!combo) return next(new AppError('Combo not found', 404));
    await combo.deleteOne();
    sendResponse(res, 200, 'Combo deleted');
};

const getComboById = async (req, res, next) => {
    const combo = await Combo.findById(req.params.id).populate('products.productId', 'name price discountPrice images isAvailable');
    if (!combo) return next(new AppError('Combo not found', 404));
    sendResponse(res, 200, 'Combo fetched', { combo });
}

module.exports = { getCombos, createCombo, updateCombo, deleteCombo, getComboById };
