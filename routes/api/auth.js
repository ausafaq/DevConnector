const express = require('express');
const router =  express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');

// @route GET api/auth
// @desc Test route
// @access Public
router.get('/', auth,  async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  POST api/auth
// @desc   Authenticate User
// @access Public
router.post(
    '/', 
    [
        // Name
        check('name', 'Name is required')
            .not()
            .isEmpty(),
        // Email
        check('email', 'Please include a valid email').isEmail(),
        // Password
        check('password', 'Please enter a password with 6 or more characters')
            .isLength({ min: 6 })
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if(user) {
                return res.status(400).json({errors : [{ msg : 'User already exists' }]});
            }

            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            user = new User({
                name,
                email,
                avatar,
                password
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            const payload = {
                user: {
                    id: user.id,

                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 3600 }, 
                (err, token) => {
                    if(err) throw err;
                    res.json({ token });
                }
            );
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    }
);

module.exports = router;