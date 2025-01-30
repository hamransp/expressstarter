import { app, port } from './app/api'
import routes from './routes/v1/index.route'
import db, { initializeModels } from './models/index.model'
import { checkConfigDatabase } from './utils/configDatabaseChecker'

async function initializeServer() {
  let server: any = null
  let retryCount = 0; // Add retry counter
  while (true) {
    try {
      // Cek konfigurasi database
      console.clear();
      if (!checkConfigDatabase()) {
        retryCount++;
        console.log('\nMenunggu konfigurasi database...');
        console.log(`Percobaan ke-${retryCount}`);
        // Tunggu 10 detik sebelum mencoba lagi
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }

      // Inisialisasi model-model
      const { sequelize } = await initializeModels()
      console.log('Models have been initialized successfully.')

      // Authenticate database connection
      await sequelize.authenticate()
      console.log('Database connection has been established successfully.')

      app.use(routes)

      // Function to start server
      const startServer = () => {
        return new Promise((resolve, reject) => {
          server = app
            .listen(port)
            .on('listening', () => {
              console.log('App is running on port', port)
              resolve(server)
            })
            .on('error', (err: NodeJS.ErrnoException) => {
              reject(err)
            })
        })
      }

      // Start the server
      await startServer()
      break; // Keluar dari loop setelah server berhasil start

    } catch (error) {
      console.log('Unable to start server:', error)
      console.log('Mencoba ulang dalam 10 detik...')
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  return server
}

async function cleanup() {
  try {
    await db.closeConnection()
    console.log('Database connection closed.')
  } catch (error) {
    console.log('Error during cleanup:', error)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await cleanup()
  process.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error)
  await cleanup()
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  await cleanup()
  process.exit(1)
})

let server = initializeServer()
