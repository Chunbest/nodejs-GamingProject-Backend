const express = require('express')
const cors = require('cors')
const path = require('path')
const pinoHttp = require('pino-http')
console.log("[Render][app] 基本套件載入完成");

const logger = require('./utils/logger')('App')
const usersRouter = require('./routes/users')
const categoryRouter = require('./routes/category')
const productRouter = require('./routes/products')
const ordersRouter = require('./routes/orders')

console.log("[Render][app] 所有 routes 載入完成");

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(pinoHttp({
	logger,
	serializers: {
		req(req) {
			req.body = req.raw.body
			return req
		}
	}
}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/healthcheck', (req, res) => {
	res.status(200)
	res.send('OK')
})
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/category', categoryRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/orders', ordersRouter)

//status改成statusCode 
//加入res回傳強制JSON
app.use((err, req, res, next) => {
	if (req.log && typeof req.log.error === 'function') {
		req.log.error(err)
	} else {
		console.error('[Error Handler] log missing:', err)
	}
	const status = err.statusCode || err.status || 500
	res.status(status)
	   .type('application/json') // 確保 Content-Type 是 JSON
	   .json({
			message: err.message || '伺服器錯誤'
		})
  })
  
module.exports = app
