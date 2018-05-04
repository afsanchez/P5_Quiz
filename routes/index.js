var express = require('express');
var app = express();

var router = express.Router();
app.use(credits);
app.use(quizzes);

router.get(GET/credits);
router.get(GET/quizzes);