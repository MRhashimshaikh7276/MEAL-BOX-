
const express = require('express');
const router = express.Router();
const comboController = require('../controllers/combo.controller');
const createUploader = require('../middleware/upload.middleware');
const upload = createUploader('combo');
router.get('/', comboController.getCombos);
router.post('/', upload.single('image'), comboController.createCombo);
router.get('/:id', comboController.getComboById);
router.put('/:id', upload.single('image'), comboController.updateCombo);
router.delete('/:id', comboController.deleteCombo);

module.exports = router;