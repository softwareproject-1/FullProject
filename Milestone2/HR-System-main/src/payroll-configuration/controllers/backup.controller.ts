import { Controller, Post, UseGuards } from '@nestjs/common';
import { BackupService } from '../services/backup.service';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('backups')
@UseGuards(AuthenticationGuard, RolesGuard)
export class BackupController {
  constructor(private readonly service: BackupService) {}

  @Post()
  @Roles('System Admin')
  manualBackup() {
    this.service.backupDatabase();
    return { message: 'Backup started successfully' };
  }
}
