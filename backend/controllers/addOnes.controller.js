const addOnes = require('../models/addOnes');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');


const getAddOnes = async (req, res, next) => {
    const addOnesList = await addOnes.find().sort('-createdAt');
    sendResponse(res, 200, 'Add-ones fetched', { addOnes: addOnesList });
};

// Get addOnes for a specific product
const getAddOnesByProduct = async (req, res, next) => {
    const { productId } = req.query;

    let query = { isAvailable: true };

    // If productId provided, filter by that product only
    if (productId) {
        query.$or = [
            { products: productId },
            { products: { $exists: true, $size: 0 } } // Empty array = available for all products
        ];
    }

    const addOnesList = await addOnes.find(query).sort('-createdAt');
    sendResponse(res, 200, 'Add-ones fetched', { addOnes: addOnesList });
};

const createAddOne = async (req, res, next) => {

    const { name, price, discountPrice, status, products } = req.body;

    const addOneData = {
        name,
        price: parseFloat(price) || 0,
        discountPrice: discountPrice ? parseFloat(discountPrice) : 0,
        isAvailable: status === "true" || status === true
    }

    // Handle products array
    if (products) {  
        const productsArray = Array.isArray(products) ? products : products.split(',');
        addOneData.products = productsArray.filter(p => p);
    }

    // Handle image upload
    if (req.file) {
        addOneData.images = [`/uploads/addOnes/${req.file.filename}`];
    }

    const newAddOne = await addOnes.create(addOneData);

    sendResponse(res, 201, 'Add-one created', { addOne: newAddOne });

};

const updateAddOne = async (req, res, next) => {

    const updateData = { ...req.body };

    if (req.file) {
        updateData.images = [`/uploads/addOnes/${req.file.filename}`];
    }

    if (req.body.status !== undefined) {
        updateData.isAvailable = req.body.status === "true" || req.body.status === true;
    }

    // Handle products array    
    if (req.body.products) {
        const productsArray = Array.isArray(req.body.products) ? req.body.products : req.body.products.split(',');
        updateData.products = productsArray.filter(p => p);
    }

    const addOne = await addOnes.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    if (!addOne) {
        return next(new AppError('Add-one not found', 404));
    }

    sendResponse(res, 200, 'Add-one updated', { addOne });
};


const deleteAddOne = async (req, res, next) => {
    const addOne = await addOnes.findByIdAndDelete(req.params.id);
    if (!addOne) {
        return next(new AppError('Add-one not found', 404));
    }
    sendResponse(res, 200, 'Add-one deleted', {});
};

module.exports = {
    getAddOnes,
    getAddOnesByProduct,
    createAddOne,
    updateAddOne,
    deleteAddOne
};