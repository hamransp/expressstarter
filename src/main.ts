import { app, port } from './app/api'
import routes from './routes/v1/index.route'
import { responseApi } from './helpers/responseApi.helper'

async function initializeServer() {
  let server: any = null

  try {
    app.use(routes)

    // Function to start server
    const startServer = () => {
      return new Promise((resolve, reject) => {
        server = app
          .listen(port)
          .on('listening', () => {
            console.log('##======= App is running on PORT :', port, ' =======##')
            console.log(responseApi(200, 'Ready... :)'))
            // mainBot()
            resolve(server)
          })
          .on('error', (err: NodeJS.ErrnoException) => {
            reject(err)
          })
      })
    }

    // Start the server
    await startServer()
  } catch (error) {
    console.log('Unable to start server:', error)
    process.exit(1)
  }

  return server
}

let server = initializeServer()
