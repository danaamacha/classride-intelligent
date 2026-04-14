import { Controller, Get, Put, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Req() req: any) {
    return this.notificationsService.getAll(req.user.phoneNumber);
  }

  @Get('unread')
  getUnread(@Req() req: any) {
    return this.notificationsService.getUnread(req.user.phoneNumber);
  }

  @Get('unread/count')
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.phoneNumber);
  }

  @Put('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.phoneNumber);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(Number(id), req.user.phoneNumber);
  }
}