var express = require('express');
var router = express.Router();

router.get('/', (req,res)=>{
    res.render('./contact-us/contactUs')
});

router.get('/form', (req,res)=>{
 res.render('./contact-us/contact-us-form')
})

module.exports = router;