var express = require("express");
var router = express.Router();
const Product = require("../models/concertModel.js");
const User = require("../models/adminModel.js");

// router.get("/simpleapi", (req, res) => {
//   res.status(200).send({ text: "hello world,This is your first api call" });
// });

router.post("/create_product_api", (req, res) => {
  const { name, description, price } = req.body;
  const product = new Product({ name, description, price });

  const validationError = product.validateSync();

  if (validationError) {
    return res.status(400).json({ message: validationError.message });
  }
  product
    .save()
    .then(() => {
      res.status(201).json({ message: "product created successfully" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "server error" });
    });
});

router.get("/retrieve_product_api", (req, res) => {
  Product.find()
    .then((data) => {
      const serializedData = data.map((product) => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
      }));
      res.status(200).json({ data: serializedData });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "internal server error" });
    });
});

// for updating products

router.put("/update_product_api/:id", (req, res) => {
  const productId = req.params.id;
  const { name, description, price } = req.body;

  const product = new Product({ name, description, price });
  const validationError = product.validateSync();

  // If there are validation errors, return the error messages
  if (validationError) {
    const errors = {
      name: validationError.errors.name
        ? validationError.errors.name.properties.message
        : undefined,
      description: validationError.errors.description
        ? validationError.errors.description.properties.message
        : undefined,
      price: validationError.errors.price
        ? validationError.errors.price.properties.message
        : undefined,
    };
    return res.status(400).json({ errors });
  }

  // Update the product in the database
  Product.findByIdAndUpdate(productId, { name, description, price })
    .then(() => {
      res.status(200).json({ message: "Product updated successfully" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    });
});
module.exports = router;
