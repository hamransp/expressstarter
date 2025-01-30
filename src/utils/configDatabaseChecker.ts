/*
 * File: dbConfigChecker.ts
 * Project: infopajak
 * File Created: Friday, 10th January 2025 9:04:16 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 30th January 2025 11:45:00 am
 * Copyright 2017 - 2022 10RI Dev
 */
import fs from 'fs';
import path from 'path';

const isRunningInContainer = (): boolean => {
    try {
        return fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv');
    } catch {
        return false;
    }
};

const isRunningInKubernetes = (): boolean => {
    return !!process.env.KUBERNETES_SERVICE_HOST;
};

export const generateConfigFilename = (): string => {
    const environment = process.env.NODE_ENV || 'development';
    const dbName = process.env.DB_NAME;
    
    if (!dbName) {
        throw new Error('DB_NAME environment variable is not set');
    }
    
    return `${environment}_${dbName}.enc.ini`;
};

export const checkConfigDatabase = (): boolean => {
    try {
        if (!process.env.DB_NAME) {
            console.error('\n\x1b[31m%s\x1b[0m', 'ERROR: Environment variable DB_NAME tidak ditemukan!');
            return false;
        }

        const environment = process.env.NODE_ENV || 'development';
        const basePath = environment === 'production' ? 'dist' : 'src';
        const configPath = path.join(process.cwd(), basePath, 'databases', generateConfigFilename());

        if (!fs.existsSync(configPath)) {
            const runningIn = isRunningInKubernetes() ? 'Kubernetes' : 
                            isRunningInContainer() ? 'Docker' : 
                            'local';
            
            console.error('\n\x1b[31m%s\x1b[0m', '=== KONFIGURASI DATABASE TIDAK DITEMUKAN! ===');
            console.log('\x1b[33m%s\x1b[0m', '\nSilakan ikuti langkah berikut untuk mengatur konfigurasi database:');
            
            console.log('\n\x1b[36m%s\x1b[0m', '1. Pastikan environment variables berikut sudah diset:');
            console.log('   - NODE_ENV              : Environment aplikasi (production/development)');
            console.log('   - DB_NAME               : Nama database yang akan digunakan');
            console.log('   - CONFIG_MASTER_KEY     : Master key untuk enkripsi');
            console.log('   - CONFIG_ADDITIONAL_KEY : Additional key untuk enkripsi');
            
            if (runningIn === 'Kubernetes') {
                console.log('\n\x1b[36m%s\x1b[0m', '2. Akses pod untuk konfigurasi:');
                console.log('   kubectl exec -it [NAMA_POD] -- /bin/sh');
                console.log('\n\x1b[36m%s\x1b[0m', '3. Jalankan generator konfigurasi:');
                console.log(`   node ${basePath}/configs/keyGenerator.js`);
            } 
            else if (runningIn === 'Docker') {
                console.log('\n\x1b[36m%s\x1b[0m', '2. Akses container untuk konfigurasi:');
                console.log('   docker exec -it [NAMA_CONTAINER] /bin/sh');
                console.log('\n\x1b[36m%s\x1b[0m', '3. Jalankan generator konfigurasi:');
                console.log(`   node ${basePath}/configs/keyGenerator.js`);
            }
            else {
                console.log('\n\x1b[36m%s\x1b[0m', '2. Jalankan generator konfigurasi:');
                console.log(`   # untuk production`);
                console.log(`   node dist/configs/keyGenerator.js`);
                console.log(`   # atau untuk development`);
                console.log(`   npx ts-node ./${basePath}/configs/keyGenerator.ts`);
            }

            console.log('\n\x1b[33m%s\x1b[0m', `File konfigurasi yang akan dibuat: ${generateConfigFilename()}`);
            
            console.log('\n\x1b[36m%s\x1b[0m', 'Setelah konfigurasi:');
            if (runningIn === 'Kubernetes') {
                console.log('- Restart pod: kubectl rollout restart deployment [NAMA_DEPLOYMENT]');
            } else if (runningIn === 'Docker') {
                console.log('- Restart container: docker restart [NAMA_CONTAINER]');
            }else{
                console.log('- Tunggu beberapa saat atau Restart aplikasi anda');
            }
            
            console.log('\n\x1b[31m%s\x1b[0m', 'Aplikasi tidak dapat melanjutkan tanpa konfigurasi database.\n');
            return false;
        }
        return true;
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'Error saat memeriksa konfigurasi database:', error);
        return false;
    }
};