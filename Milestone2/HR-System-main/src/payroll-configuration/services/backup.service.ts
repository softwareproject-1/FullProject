import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

@Injectable()
export class BackupService {
  private backupDir = path.join(__dirname, '../../backups');

  // Your Atlas connection string
  private mongoUri =
    'mongodb+srv://Team5:GYL2025@cluster0.4mleald.mongodb.net/FullProjectDB?retryWrites=true&w=majority';

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Automatic daily backup
  @Cron('0 2 * * *') // every day at 2 AM
  backupDatabase() {
    const fileName = `backup-${Date.now()}.gz`;
    const filePath = path.join(this.backupDir, fileName);

    const command = `"D:\\Documents\\mongodb-database-tools-windows-x86_64-100.14.0\\bin\\mongodump.exe" --uri="${this.mongoUri}" --archive="${filePath}" --gzip`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed', error);
      } else {
        console.log('Backup created:', fileName);
        if (stdout) console.log('stdout:', stdout);
        if (stderr) console.log('stderr:', stderr);
      }
    });
  }
}
