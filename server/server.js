
const Roomber = require("./roomber")

new Roomber()
	.listen(process.env.PORT || 5000)
