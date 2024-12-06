module.exports = {
  apps: [
    {
      name: 'starter-express',
      script: './dist/main.js',
      watch: true,
      ignore_watch: ['src/logs'], // Mengecualikan folder src/logs dari pemantauan
      time: true, // Mengaktifkan opsi time
    },
  ],
}
