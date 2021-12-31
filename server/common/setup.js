const { User } = require('../models/User');

const createAdmin = () => {
    User.findOne({ 'SABUN': 'P9999999' }, (err, user) => {
        if (err) console.log(err);
        if (!user) {
            let admin = new User({
                name: '관리자',
                password: 'nacf1234!',
                role: '1',
                OFFICE_CODE: '7831',
                SABUN: 'P9999999',
                terms: true,
                privacy: true
            });
            admin.save((err) => {
            if (err) console.log('admin create failed!');
            else console.log('admin create success!');
          })
        }
    });
}

module.exports = {createAdmin}
