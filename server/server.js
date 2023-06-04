const Remember = require("./Remember")
new Remember()
	.listen(process.env.PORT || 5000)
